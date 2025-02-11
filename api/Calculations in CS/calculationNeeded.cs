using System;
using System.Collections.Generic;

namespace BallisticsModule
{
    // Data Structures
    public class BallisticSimParameters
    {
        public float Penetration { get; set; }
        public float Damage { get; set; }
        public int ArmorDamagePerc { get; set; }
        public ArmorLayer[] ArmorLayers { get; set; }
    }

    public class ArmorLayer
    {
        public int ArmorClass { get; set; }
        public float Durability { get; set; }
        public float MaxDurability { get; set; }
        public float BluntDamageThroughput { get; set; }
        public bool IsPlate { get; set; }
        public ArmorMaterial ArmorMaterial { get; set; }
    }

    public enum ArmorMaterial
    {
        Aramid,
        UHMWPE,
        Combined,
        Titan,
        Aluminium,
        ArmoredSteel,
        Ceramic,
        Glass
    }

    public class BallisticSimResult
    {
        public float PenetrationChance { get; set; }
        public float PenetrationDamage { get; set; }
        public float MitigatedDamage { get; set; }
        public float BluntDamage { get; set; }
        public float AverageDamage { get; set; }

        public float PenetrationArmorDamage { get; set; }
        public float BlockArmorDamage { get; set; }
        public float AverageArmorDamage { get; set; }
        public float PostHitArmorDurability { get; set; }

        public float ReductionFactor { get; set; }
        public float PostArmorPenetration { get; set; }
    }

    public static class Ballistics
    {
        // Single Shot Calculation
        public static List<BallisticSimResult> CalculateSingleShot(BallisticSimParameters bsp)
        {
            ArmorLayer[] layers = bsp.ArmorLayers;
            List<BallisticSimResult> results = new List<BallisticSimResult>();

            float currentPenetration = bsp.Penetration;
            float currentDamage = bsp.Damage;

            foreach (var layer in layers)
            {
                float armorDurabilityPercent = (layer.Durability / layer.MaxDurability) * 100;
                var penetrationChance = PenetrationChance(layer.ArmorClass, currentPenetration, armorDurabilityPercent);

                var penetrationDamage = PenetrationDamage(armorDurabilityPercent, layer.ArmorClass, currentDamage, currentPenetration);
                var mitigatedDamage = currentDamage - penetrationDamage;

                var bluntDamage = BluntDamage(armorDurabilityPercent, layer.ArmorClass, layer.BluntDamageThroughput / 100, currentDamage, currentPenetration);

                var averageDamage = (penetrationDamage * penetrationChance) + (bluntDamage * (1 - penetrationChance));

                var penetrationArmorDamage = DamageToArmorPenetration(layer.ArmorClass, layer.ArmorMaterial, currentPenetration, bsp.ArmorDamagePerc, armorDurabilityPercent);
                var blockArmorDamage = DamageToArmorBlock(layer.ArmorClass, layer.ArmorMaterial, currentPenetration, bsp.ArmorDamagePerc, armorDurabilityPercent);

                var averageArmorDamage = (penetrationArmorDamage * penetrationChance) + (blockArmorDamage * (1 - penetrationChance));
                var postHitArmorDurability = Math.Max(layer.Durability - averageArmorDamage, 0);

                float reductionFactor = (float)CalculateReductionFactor(currentPenetration, armorDurabilityPercent, layer.ArmorClass);
                currentPenetration *= reductionFactor;
                currentDamage *= reductionFactor;

                results.Add(new BallisticSimResult
                {
                    PenetrationChance = (float)penetrationChance,
                    PenetrationDamage = (float)penetrationDamage,
                    MitigatedDamage = (float)mitigatedDamage,
                    BluntDamage = (float)bluntDamage,
                    AverageDamage = (float)averageDamage,

                    PenetrationArmorDamage = (float)penetrationArmorDamage,
                    BlockArmorDamage = (float)blockArmorDamage,
                    AverageArmorDamage = (float)averageArmorDamage,
                    PostHitArmorDurability = (float)postHitArmorDurability,

                    ReductionFactor = (float)reductionFactor,
                    PostArmorPenetration = currentPenetration
                });
            }

            return results;
        }

        // Helper Functions
        public static double PenetrationChance(int armorClass, float bulletPen, float armorDurabilityPerc)
        {
            double factorA = CalculateFactorA(armorDurabilityPerc, armorClass);
            if (armorDurabilityPerc == 0) return 1;
            if (factorA <= bulletPen) return (100 + (bulletPen / (.9 * factorA - bulletPen))) / 100;
            if (factorA - 15 < bulletPen && bulletPen < factorA) return 0.4 * Math.Pow(factorA - bulletPen - 15, 2) / 100;
            return 0;
        }

        public static double PenetrationDamage(double armorDurabilityPercent, int armorClass, double bulletDamage, double bulletPenetration)
        {
            double factorA = CalculateFactorA(armorDurabilityPercent, armorClass);
            double reduction = Math.Max(0.6, bulletPenetration / (factorA + 12));
            return reduction * bulletDamage;
        }

        public static double BluntDamage(double armorDurabilityPercent, int armorClass, double bluntThroughput, double bulletDamage, double bulletPenetration)
        {
            double factorA = CalculateFactorA(armorDurabilityPercent, armorClass);
            double reduction = Math.Max(0.2, 1 - (0.03 * (factorA - bulletPenetration)));
            return bluntThroughput * reduction * bulletDamage;
        }

        public static double DamageToArmorPenetration(int armorClass, ArmorMaterial material, double bulletPen, int armorDamagePerc, double armorDurability)
        {
            double destructibility = GetDestructibility(material);
            return Math.Max(1, bulletPen * (armorDamagePerc / 100.0) * destructibility);
        }

        public static double DamageToArmorBlock(int armorClass, ArmorMaterial material, double bulletPen, int armorDamagePerc, double armorDurability)
        {
            double destructibility = GetDestructibility(material);
            return Math.Max(1, bulletPen * (armorDamagePerc / 100.0) * destructibility * 0.5);
        }

        public static double CalculateReductionFactor(double penetrationPower, double armorDurabilityPerc, int armorClass)
        {
            double factorA = CalculateFactorA(armorDurabilityPerc, armorClass);
            return Math.Clamp(penetrationPower / (factorA + 12), 0.6, 1.0);
        }

        public static double CalculateFactorA(double armorDurabilityPerc, int armorClass)
        {
            return (121 - 5000 / (45 + (armorDurabilityPerc * 2))) * armorClass * 0.1;
        }

        public static double GetDestructibility(ArmorMaterial material)
        {
            return material switch
            {
                ArmorMaterial.Aramid => 0.1875,
                ArmorMaterial.UHMWPE => 0.3375,
                ArmorMaterial.Combined => 0.375,
                ArmorMaterial.Titan => 0.4125,
                ArmorMaterial.Aluminium => 0.45,
                ArmorMaterial.ArmoredSteel => 0.525,
                ArmorMaterial.Ceramic => 0.55,
                ArmorMaterial.Glass => 0.6,
                _ => 1.0
            };
        }
    }
}

const ArmorMaterial = {
    ARAMID: 'Aramid',
    UHMWPE: 'UHMWPE',
    COMBINED: 'Combined',
    TITAN: 'Titan',
    ALUMINIUM: 'Aluminium',
    ARMORED_STEEL: 'ArmoredSteel',
    CERAMIC: 'Ceramic',
    GLASS: 'Glass'
};

const maxHP = 440;

const hitPartMultiplier = {
    left_arm: 0.49,
    right_arm: 0.49,
    left_leg: 0.7,
    right_leg: 0.7,
    stomach: 1.05,
    // head: 100,
    // thorax: 100
}

function getDestructibility(material) {
    const destructibility = {
        Aramid: 0.1875,
        UHMWPE: 0.3375,
        Combined: 0.375,
        Titan: 0.4125,
        Aluminium: 0.45,
        ArmoredSteel: 0.525,
        Ceramic: 0.55,
        Glass: 0.6
    };

    return destructibility[material] || 1.0;
}

function calculateFactorA(armorDurabilityPerc, armorClass) {
    return (121 - 5000 / (45 + (armorDurabilityPerc * 2))) * armorClass * 0.1;
}

function penetrationChance(armorClass, bulletPen, armorDurabilityPerc) {
    const factorA = calculateFactorA(armorDurabilityPerc, armorClass);
    if (armorDurabilityPerc === 0) return 1;
    if (factorA <= bulletPen) return (100 + (bulletPen / (0.9 * factorA - bulletPen))) / 100;
    if (factorA - 15 < bulletPen && bulletPen < factorA) return 0.4 * Math.pow(factorA - bulletPen - 15, 2) / 100;
    return 0;
}

function penetrationDamage(armorDurabilityPerc, armorClass, bulletDamage, bulletPenetration) {
    function median(a, b, c) {
        const arr = [a, b, c].sort((x, y) => x - y);
        return arr[1];
    }

    const factorA = calculateFactorA(armorDurabilityPerc, armorClass);
    const medianResult = median(0.6, bulletPenetration / (factorA + 12), 1);
    const finalResult = medianResult * bulletDamage;

    return finalResult;
}

function bluntDamage(armorDurabilityPerc, armorClass, bluntThroughput, bulletDamage, bulletPenetration) {
    function median(a, b, c) {
      const arr = [a, b, c].sort((x, y) => x - y);
      return arr[1];
    }
  
    const factorA = calculateFactorA(armorDurabilityPerc, armorClass);
    const medianResult = median(0.2, 1 - (0.03 * (factorA - bulletPenetration)), 1);
  
    const finalResult = bluntThroughput * medianResult * bulletDamage;
    return finalResult;
}

function damageToArmorPenetration(armorClass, armorMaterial, bulletPenetration, bulletArmorDamagePercentage, armorDurability) {
    const armorDestructibility = getDestructibility(armorMaterial);
    const armorDamagePercentage = bulletArmorDamagePercentage / 100;

    const clampedFactor = Math.min(Math.max((bulletPenetration / armorClass) * 10, 0.5, 0.9), 0.9);
    let result = bulletPenetration * armorDamagePercentage * clampedFactor * armorDestructibility;

    result = Math.max(result, 1);

    return result;
}

function damageToArmorBlock(armorClass, armorMaterial, bulletPenetration, bulletArmorDamagePercentage, armorDurability) {
    const armorDestructibility = getDestructibility(armorMaterial);
    const armorDamagePercentage = bulletArmorDamagePercentage / 100;

    const clampedFactor = Math.min(Math.max((bulletPenetration / armorClass) * 10, 0.6, 1.1), 1.1);
    let result = bulletPenetration * armorDamagePercentage * clampedFactor * armorDestructibility;

    result = Math.max(result, 1);

    return result;
}

function calculateReductionFactor(penetrationPower, armorDurabilityPerc, armorClass) {
    const factorA = calculateFactorA(armorDurabilityPerc, armorClass);
    return Math.min(Math.max(penetrationPower / (factorA + 12), 0.6), 1.0);
}

console.log(calculateReductionFactor(20, 100, 2));

// Main Ballistic Calculation
function calculateSingleShot(params) {
    let currentPenetration = params.penetration;
    let currentDamage = params.damage;
    let layer = params.armorLayer;
    
    const armorDurabilityPerc = (layer.durability / layer.maxDurability) * 100;
    const penChance = penetrationChance(layer.armorClass, currentPenetration, armorDurabilityPerc);

    const penDamage = penetrationDamage(armorDurabilityPerc, layer.armorClass, currentDamage, currentPenetration);
    const mitigatedDamage = currentDamage - penDamage;

    var bluntThroughput = layer.bluntDamageThroughput;
    if (layer.isPlate)
    {
        bluntThroughput = bluntThroughput * 0.6;
    }        

    const bluntDmg = bluntDamage(armorDurabilityPerc, layer.armorClass, (bluntThroughput / 100), currentDamage, currentPenetration);

    const avgDamage = (penDamage * penChance) + (bluntDmg * (1 - penChance));

    const penArmorDmg = damageToArmorPenetration(layer.armorClass, layer.armorMaterial, currentPenetration, params.armorDamagePerc, armorDurabilityPerc);
    const blockArmorDmg = damageToArmorBlock(layer.armorClass, layer.armorMaterial, currentPenetration, params.armorDamagePerc, armorDurabilityPerc);
    
    const avgArmorDmg = (penArmorDmg * penChance) + (blockArmorDmg * (1 - penChance));
    const postHitDurability = Math.max(layer.durability - avgArmorDmg, 0);

    const reductionFactor = calculateReductionFactor(currentPenetration, armorDurabilityPerc, layer.armorClass);
    currentPenetration *= reductionFactor;
    currentDamage *= reductionFactor;

    return {
        penetrationChance: penChance,
        penetrationDamage: penDamage,
        mitigatedDamage: mitigatedDamage,
        bluntDamage: bluntDmg,
        averageDamage: avgDamage,

        penetrationArmorDamage: penArmorDmg,
        blockArmorDamage: blockArmorDmg,
        averageArmorDamage: avgArmorDmg,
        postHitArmorDurability: postHitDurability,

        reductionFactor: reductionFactor,
        postArmorPenetration: currentPenetration
    };
}

function blackOutSpread(bodyHP, overflow, hitPart) {
    let currentMaxHP = 0;
    
    Object.values(bodyHP).forEach((part) => {
        currentMaxHP += part.maxHP;
    });

    Object.values(bodyHP).forEach((part) => {
        if (part.currentHP === 0) {
            currentMaxHP -= part.maxHP;
        }
    });

    console.log(hitPartMultiplier["head"]);
    let damage = hitPartMultiplier[hitPart] * overflow;

    Object.values(bodyHP).forEach((part) => {
        if (part.currentHP !== 0) {
            part.currentHP = Math.max(part.currentHP - Math.round(damage * part.maxHP / currentMaxHP), 0);
        }
    });

    return bodyHP;
}

module.exports= {calculateSingleShot, penetrationChance, calculateReductionFactor,blackOutSpread};

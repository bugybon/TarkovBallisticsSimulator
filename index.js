const express = require('express');
const app = express();
const path = require('path');
const api = require('./api');
const cors = require('cors');

const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const { blackOutSpread } = require('./api/balistics');
const io = new Server(server, {
  cors: { origin: "*" }
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/pages'));
app.use(cors());
app.use(express.static('node_modules'));
app.use(express.static('static'));

function globalErrorHandler(err, req, res, next) {
  if (err.code === 'ENOENT')
    res.code(404).end();
  res.code(500).end();
}

app.use(globalErrorHandler);

app.get('/', (req, res) => {
  res.render('home');
})

const armorDataBD = api.itemQuery.getArmorRig().then((data) =>{
  return data.items;
});

const armorPlateDataDB = api.itemQuery.getArmorPlate().then((data) =>{
  //console.log(data.items);
  return data.items;
});

function findItemAsync(itemName,location) {
  return new Promise((resolve) => {
      setTimeout(() => { 
          //armorDataBD.then((data)=>{console.log(data)});
          const armor = location.then((data) => {
            return data.find(a => a.name.toLowerCase() === itemName.toLowerCase())
          });
          resolve(armor);
      }, 50); 
  });
}

io.on("connection", (socket) => {
    console.log(socket.id);

    socket.on('requestArmorNames', async () => {
      try {
        let names = await api.itemQuery.getArmorRig();
        names = names.items;
        names = names.filter((item) => 
          item.properties.armorSlots !== null
        ).map((item) =>
          item.name
        );
        
        if(names){
          socket.emit('recieveArmorNames', names);
        }else{
          socket.emit('recieveArmorNamesError',{error: "Names couldn't be generated"});
        }
      }catch(error){
        console.error("Error fetching armor data:", error);
        socket.emit('recieveArmorNamesError', { error: "Server error" });
      }
    });

    socket.on('requestHelmetNames', async () => {
      try {
        let names = await api.itemQuery.getHelmet();
        names = names.items;
        names = names.map((item) =>
          item.name
        );
        
        if(names){
          socket.emit('recieveHelmetNames', names);
        }else{
          socket.emit('recieveHelmetNamesError',{error: "Names couldn't be generated"});
        }
      }catch(error){
        console.error("Error fetching Helmet data:", error);
        socket.emit('recieveHelmetNamesError', { error: "Server error" });
      }
    });

    socket.on('requestArmorData', async(armorName) => {
        try {
          const armor = await findItemAsync(armorName,armorDataBD); 

          if (armor) {
              socket.emit('recieveArmorData', armor);
          } else {
              socket.emit('recieveArmorDataError', { error: "Armor not found" });
          }
      } catch (error) {
          console.error("Error fetching armor data:", error);
          socket.emit('recieveArmorDataError', { error: "Server error" });
      }
    });

    socket.on('plateSelected', async(plateName) => {
      try {
        const plate = await findItemAsync(plateName,armorPlateDataDB); 

        if (plate) {
            socket.emit('recievePlateData', plate);
        } else {
            socket.emit('recievePlateDataError', { error: "Plate not found" });
        }
      } catch (error) {
        console.error("Error fetching plate data:", error);
        socket.emit('recievePlateDataError', { error: "Server error" });
      }
    });

    socket.on('requestBullets', async (bullet) =>{
      try {
        let location = await api.itemQuery.getBullet();
        location = location.ammo;
        let names = location.find(a => a.item.name.toLowerCase() === bullet.toLowerCase());
        
        if(names){
          socket.emit('recieveBulletsData', names);
        }else{
          socket.emit('recieveBulletsError',{error: "Bullets couldn't be generated"});
        }
      }catch(error){
        console.error("Error fetching bullet data:", error);
        socket.emit('recieveBulletsError', { error: "Server error" });
      }
    });

    socket.on('requestBulletNames', async () =>{
      try {
        let names = await api.itemQuery.getBullet();
        names = names.ammo;
        names = names.sort((a,b) => {
          if (a.caliber === b.caliber){
            return a.item.name > b.item.name ? 1 : -1;
          };
          return a.caliber > b.caliber ? 1 : -1;
        }).map((item) => [item.caliber, item.item.name]);
        
        if(names){
          socket.emit('recieveBulletNames', names);
        }else{
          socket.emit('recieveBulletNamesError',{error: "BulletNames couldn't be generated"});
        }
      }catch(error){
        console.error("Error fetching armor data:", error);
        socket.emit('recieveBulletNamesError', { error: "Server error" });
      }
    });

    function getBulletData(socket) {
        return new Promise((resolve) => {
            socket.once("sendBulletData", (bulletData) => {
                resolve(bulletData);
            });
        });
    }

    function getBodyHP(socket) {
        return new Promise((resolve) => {
            socket.once("sendBodyHP", (bodyHP) => {
                resolve(bodyHP);
            });
        });
    }
  
    socket.on("sendHitAreas", async (intersects) => {
        console.log("Hit areas received:", intersects);
      
        let bulletData;
        socket.emit("requestBulletData");
        try {
            bulletData = await getBulletData(socket); 
            //console.log("Using bullet data inside sendHitAreas:", bulletData);
        } catch (error) {
            console.error(error.message);
        }

        let bodyHP;
        io.emit("requestBodyHP"); 
        try {
            bodyHP = await getBodyHP(socket); 
            //console.log("Using bodyHP data inside sendHitAreas:", bodyHP);
        } catch (error) {
            console.error(error.message);
        }

        let currBulletDmg = bulletData.damage;
        let currBulletPenetration = bulletData.penetration;
        let armorDamage = bulletData.armorDamage;

        function mapHitboxToPart(hitboxName) {
            return hitboxToPartMapping[hitboxName] || "unknown"; 
        }

        function probabilityCheck(chance) {
            return Math.random() < (chance / 100);
        }

        async function getArmorData(part) {
          return new Promise((resolve, reject) => {
              io.emit("getArmorPart", part);
              socket.once("sendArmorPart", (armorData) => {
                  resolve(armorData);
              });
      
              // setTimeout(() => {
              //     console.error(`Timeout: No response for armor part ${part}`);
              //     reject(new Error(`Timeout waiting for armor data: ${part}`));
              // }, 2000);
          });
      }

      function findFirstFleshPart(intersects, startIndex) {
        for (let i = startIndex; i < intersects.length; i++) {
          const part = mapHitboxToPart(intersects[i]);
          if (fleshParts.includes(part)) {
            return part; 
          }
        }
        return null; 
      }
      
        for (let i = 0; i < intersects.length; ++i) {
          hitboxName = intersects[i];
          let part = mapHitboxToPart(hitboxName); 
          console.log(part);

          if(fleshParts.includes(part)){
            const penChance = api.ballistics.penetrationChance(2, currBulletPenetration, (bodyHP[part].currentHP/bodyHP[part].maxHP)*100)*100;
            const reductionFactor = api.ballistics.calculateReductionFactor(currBulletPenetration, ((bodyHP[part].currentHP/bodyHP[part].maxHP)*100), 2);
            console.log(reductionFactor);
            console.log("Penetration chance of the bullet for the", part,  "is", penChance);

            if(bodyHP[part].currentHP - currBulletDmg >= 0){
              bodyHP[part].currentHP = bodyHP[part].currentHP - currBulletDmg;
            } else {
              const overflow = currBulletDmg - bodyHP[part].currentHP ;
              bodyHP[part].currentHP = 0;
              bodyHP = api.ballistics.blackOutSpread(bodyHP, overflow, part);
            }
            if (probabilityCheck(penChance)) {
                console.log("Successful penetration (", penChance, "% chance to pen!)");
                currBulletDmg = currBulletDmg*reductionFactor;
                currBulletPenetration = currBulletPenetration*reductionFactor;

                console.log("curr bullet dmg and penetration: ", currBulletDmg, currBulletPenetration);
            } else {
                console.log("Failure to penetrate (", (100 - penChance), "% chance lowroll happened!)");
                break;
            }
          }else{
            const armorData = await getArmorData(part);
            console.log(armorData);
            //console.log(part);

            if(armorData.error){
              continue;
            }

            const params = {
              penetration: currBulletPenetration,
              damage: currBulletDmg,
              armorDamagePerc: armorDamage,
              armorLayer: {
                  isPlate: part.toLowerCase().includes("plate"),
                  armorClass: parseInt(armorData.class),
                  bluntDamageThroughput: parseFloat(armorData.blunt_number),
                  durability: parseFloat(armorData.durability.current),
                  maxDurability: parseFloat(armorData.durability.max),
                  armorMaterial: armorData.material
                }
            };

            console.log(params);

            const results = api.ballistics.calculateSingleShot(params);
            // console.log(results);
            // console.log(results.penetrationChance);

            console.log({
              part: part,
              cur: Math.max(parseFloat(armorData.durability.current) - results.penetrationArmorDamage, 0),
              max: parseFloat(armorData.durability.max)
            });

            if (probabilityCheck(results.penetrationChance*100)) {
                console.log("Successful penetration (", results.penetrationChance*100, "% chance to pen!)");
                socket.emit('updatePlate', {
                  part: part,
                  cur: Math.max(parseFloat(armorData.durability.current) - results.penetrationArmorDamage, 0),
                  max: parseFloat(armorData.durability.max)
                });

                currBulletDmg = currBulletDmg*results.reductionFactor;
                currBulletPenetration = results.postArmorPenetration;
                console.log("curr bullet dmg and penetration: ", currBulletDmg, currBulletPenetration);
              }else{
                console.log("Failure to penetrate (", (100 - (results.penetrationChance*100)), "% chance lowroll happened!)");
                socket.emit('updatePlate', {
                  part: part,
                  cur: Math.max(parseFloat(armorData.durability.current) - results.penetrationArmorDamage, 0),
                  max: parseFloat(armorData.durability.max)
                });
                
                const damage = (currBulletDmg-results.mitigatedDamage)*results.bluntDamage*results.reductionFactor;
                console.log(damage);
                const flesh = findFirstFleshPart(intersects, i);
                  if(flesh){
                    if(bodyHP[flesh].currentHP - damage >= 0){
                      bodyHP[flesh].currentHP = bodyHP[flesh].currentHP - damage;
                    } else {
                      const overflow = damage - bodyHP[flesh].currentHP ;
                      bodyHP[flesh].currentHP = 0;
                      bodyHP = api.ballistics.blackOutSpread(bodyHP, overflow, flesh);
                    }
                }
                break;
              }
            
          }
      }
      //socket.emit('updatePlate', {part:"soft-armor-Soft_armor_front", cur:10, max:20});

      console.log("about to emit HP");
      console.log(bodyHP);
      //socket.emit('updateHP', bodyHP);
      io.emit("updateHP", bodyHP);
    });
  
    const fleshParts = ["head", "thorax", "left_arm", "right_arm", "stomach", "right_leg", "left_leg"];

    const hitboxToPartMapping = {   
      "ThoraxPlateArmorHitbox": "plate-container-front_plate",
      "BackPlateArmorHitbox": "plate-container-back_plate",
      "LeftSidePlateArmorHitbox": "plate-container-left_side_plate",
      "RightSidePlateArmorHitbox": "plate-container-right_side_plate",
      
      "SoftArmorFrontHitbox": "soft-armor-Soft_armor_front",
      "BackSoftArmorHitbox": "soft-armor-Soft_armor_back",
      "LeftSideSoftArmorHitbox": "soft-armor-Soft_armor_left",
      "RightSideSoftArmorHitbox": "soft-armor-Soft_armor_right",
      "NeckSoftArmorHitbox": "soft-armor-Collar",
      "GroinSoftArmorHitbox": "soft-armor-Groin",
      "LeftArmSoftArmorHitbox": "soft-armor-Shoulder_l",
      "RightArmSoftArmorHitbox": "soft-armor-Shoulder_r",
      "ButtoxSoftArmorHitbox": "soft-armor-Groin_back",
      "EarsHeadArmorHitbox": "head-ears-armor",
      "HelmetTopHitbox": "head-top-armor",
      "HelmetNapeHitbox": "head-nape-armor",
      "EyesHeadArmorHitbox": "head",
      "HeadHitbox": "head",
      "NeckHitbox": "head",
      "LeftArmLowerHitbox": "left_arm",
      "LeftArmUpperHitbox": "left_arm",
      "LeftLegLowerHitbox": "left_leg",
      "LeftLegUpperHitbox": "left_leg",
      "RightArmLowerHitbox": "right_arm",
      "RightArmUpperHitbox": "right_arm",
      "RightLegLowerHitbox": "right_leg",
      "RightLegUpperHitbox": "right_leg",
      "StomachHitbox": "stomach",
      "ThoraxHitbox": "thorax"
  };

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
})

server.listen(3000, () => {
  console.log('Server is listening on http://localhost:3000');
});
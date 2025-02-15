const graphql_req= require('graphql-request');

const apiUrl = 'https://api.tarkov.dev/graphql';
const queryArmorRig = graphql_req.gql`{
    items(lang: en, types:[armor,rig]) {
        name
        properties{
            ...on ItemPropertiesArmor{
                armorSlots {
                    ...on ItemArmorSlotLocked{
                        nameId
                        class
                        durability
                        bluntThroughput
                        material{
                            name
                            destructibility
                        }
                    }
                    ...on ItemArmorSlotOpen{
                        nameId
                        allowedPlates{
                            name
                        }
                    }
                }
            }
            ...on ItemPropertiesChestRig{
                armorSlots{
                    ...on ItemArmorSlotLocked{
                        nameId
                        class
                      	bluntThroughput
                        durability
                        material{
                            id
                        }
                    }
                    ...on ItemArmorSlotOpen{
                        nameId
                        allowedPlates{
                            name
                        }
                    }
                }
            }
        }
    }
}`;

const queryArmorPlate = graphql_req.gql`{
    items(lang: en, type:armorPlate) {
        name
        properties{
        ...on ItemPropertiesArmorAttachment{
          durability
          class
          bluntThroughput
          material {
            id
          }
        }
      }
    }
}`;

const queryBullet = graphql_req.gql`{
    ammo(lang: en) {
        item{
          name
        }
        caliber
        damage
        armorDamage
        projectileCount
        fragmentationChance
        ricochetChance
        penetrationPower
        penetrationChance
        penetrationPowerDeviation
        lightBleedModifier
        heavyBleedModifier
    }
}`;

const queryHelmets = graphql_req.gql`{
    items(lang: en, types: [helmet]) {
      name
      properties {
        ... on ItemPropertiesHelmet {
          armorSlots {
            ... on ItemArmorSlotLocked {
              nameId
              class
              durability
              bluntThroughput
              ricochetX
              ricochetY
              ricochetZ
              material {
                name
                destructibility
              }
            }
          }
        }
      }
    }
  }`;

async function getArmorRig(){
    return new Promise((res,rej) => {
        let content = graphql_req.request(apiUrl, queryArmorRig);
        res(content);
    });
}

async function getArmorPlate(){
    return new Promise(async (res,rej) => {
        let content = await graphql_req.request(apiUrl, queryArmorPlate);
        res(content);
    });
}

async function getBullet(){
    return new Promise(async (res,rej) => {
        let content = await graphql_req.request(apiUrl, queryBullet);
        res(content);
    });
}

async function getHelmets(){
    return new Promise(async (res, rej)=>{
        let content = await graphql_req.request(apiUrl, queryHelmets);
        res(content);
    });
}

module.exports= {getArmorRig, getArmorPlate, getBullet, getHelmets};
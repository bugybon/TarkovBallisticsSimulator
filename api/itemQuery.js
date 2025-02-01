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
          material {
            id
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

module.exports= {getArmorRig, getArmorPlate};
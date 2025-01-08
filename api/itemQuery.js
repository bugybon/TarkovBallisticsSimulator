const graphql_req= async () =>{const {gql,request} = await import('graphql-request');
gql.default();
request.default()};

const apiUrl = 'https://api.tarkov.dev/graphql';
const queryArmorRig = gql`{
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

const queryArmorPlate = gql`{
    items(lang: en, type:armorPlate) {
        name
        properties{
        ...on ItemPropertiesArmorAttachment{
          durability
          class
          material {
            id
          }
          zones
        }
      }
    }
}`;

function getArmorRig(){
    return new Promise((res, rej) => {
        graphql_req.request(apiUrl, queryArmorRig).then((data) => console.log(data));
    });
}

function getArmorPlate(){
    return new Promise((res, rej) => {
        request(apiUrl, queryArmorPlate).then((data) => console.log(data));
    });
}

module.exports= {getArmorRig, getArmorPlate};
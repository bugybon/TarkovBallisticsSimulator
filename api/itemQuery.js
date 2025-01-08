const graphql_req = require('graphql-request');

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

graphql_req.request(apiUrl, queryArmorRig).then((data) => console.log(data));
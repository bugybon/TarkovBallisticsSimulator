import * as myQuery from 'query.js';

async function query(options) {
    const { language, gameMode, prebuild} = myQuery.options;
    const itemLimit = 20000;
    const QueryBody = offset => {
        return `query TarkovDevItems {
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
    };
    const itemData = await Promise.all(
        new Promise(async (resolve, reject) => {
            let offset = 0;
            const retrievedItems = {
                data: {
                    items: [],
                },
                errors: [],
            };
            while (true) {
                const query = QueryBody(offset).replace(/\s{2,}/g, ' ');
                const itemBatch = await this.graphqlRequest(query).catch(reject);
                if (!itemBatch) {
                    break;
                }
                if (itemBatch.errors) {
                    retrievedItems.errors.concat(itemBatch.errors);
                }
                if (itemBatch.data && itemBatch.data.items) {
                    if (itemBatch.data.items.length === 0) {
                        break;
                    }
                    retrievedItems.data.items = retrievedItems.data.items.concat(itemBatch.data.items);
                    if (itemBatch.data.items.length < itemLimit) {
                        break;
                    }
                }
                if (!itemBatch.errors) {
                    if (!itemBatch.data || !itemBatch.data.items || !itemBatch.data.items.length) {
                        break;
                    }
                }
                offset += itemLimit;
            }
            if (retrievedItems.errors.length < 1) {
                retrievedItems.errors = undefined;
            }
            resolve(retrievedItems);
        })
    );
    console.log(itemData);
}
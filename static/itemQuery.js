//const reactquery = require('@tanstack/react-query');
const fetch = require('cross-fetch');

const apiUrl = 'https://api.tarkov.dev/graphql';

const defaultOptions = {
    language: 'en',
    gameMode: 'regular',
    prebuild: false,
};

async function graphqlRequest(queryString, variables) {
    return fetch(apiUrl, {
        method: 'POST',
        cache: 'no-store',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify({
            query: queryString.replace(/\s{2,}/g, ' '),
            variables,
        }),
    }).then(response => {
        if (!response.ok) {
            return Promise.reject(new Error(`${response.status}: ${response.statusText}`));
        }
        return response.json();
    });
}

// function useQuery(queryName, queryString, settings) {
//     return reactquery.reactUseQuery({
//         queryKey: queryName,
//         queryFn: () => graphqlRequest(queryString, settings?.gqlVariables),
//         refetchOnMount: false,
//         refetchOnWindowFocus: false,
//         ...settings,
//     });
// };

let pendingQuery = {};

async function run(query, options = defaultOptions) {
    options = {
        ...defaultOptions,
        ...options,
    };
    const pendingKey = options.language+options.gameMode;
    if (pendingQuery[pendingKey]) {
        return pendingQuery[pendingKey];
    }
    pendingQuery[pendingKey] = query(options).finally(() => {
        pendingQuery[pendingKey] = undefined;
    });
    return pendingQuery[pendingKey];
}

async function query(options = defaultOptions) {
    const { language, gameMode, prebuild} = options;
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
    const itemData = new Promise(async (resolve, reject) => {
        let offset = 0;
        const retrievedItems = {
            data: {
                items: [],
            },
            errors: [],
        };
        while (true) {
            const query = QueryBody(offset).replace(/\s{2,}/g, ' ');
            const itemBatch = await graphqlRequest(query).catch(reject);
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
    });
}

run(query).then((res) => {console.log(res);});
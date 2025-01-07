import { useQuery as reactUseQuery } from '@tanstack/react-query';

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

function useQuery(queryName, queryString, settings) {
    return reactUseQuery({
        queryKey: queryName,
        queryFn: () => graphqlRequest(queryString, settings?.gqlVariables),
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        ...settings,
    });
};

let pendingQuery = {};

function graphqlRequest(queryString, variables) {
    return graphqlRequest(queryString, variables);
}

async function query() {
    return Promise.reject('Not implemented');
}

async function run(options = defaultOptions) {
    options = {
        ...defaultOptions,
        ...options,
    };
    const pendingKey = options.language+options.gameMode;
    if (this.pendingQuery[pendingKey]) {
        return this.pendingQuery[pendingKey];
    }
    this.pendingQuery[pendingKey] = this.query(options).finally(() => {
        this.pendingQuery[pendingKey] = undefined;
    });
    return this.pendingQuery[pendingKey];
}
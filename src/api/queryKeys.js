// Central query keys so invalidation stays consistent across hooks.
export const queryKeys = {
    me: ['user', 'me'],
    users: {
        all: ['users'],
        list: (params) => ['users', 'list', params],
        detail: (id) => ['users', 'detail', id],
    },
    roles: {
        all: ['roles'],
    },
    sources: {
        all: ['sources'],
        detail: (id) => ['sources', id],
    },
    pipelines: {
        all: ['pipelines'],
        detail: (id) => ['pipelines', id],
    },
    contacts: {
        all: ['contacts'],
        lists: ['contacts', 'list'],
        list: (params) => ['contacts', 'list', params],
        detail: (id) => ['contacts', 'detail', id],
    },
    calls: {
        all: ['calls'],
        list: (contactId) => ['calls', 'list', contactId],
    },
    comments: {
        all: ['comments'],
        list: (contactId) => ['comments', 'list', contactId],
    },
}

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
    // Contact history (comments, calls, stage changes). `type` is 'all' or one entry type.
    history: {
        all: ['history'],
        contact: (contactId) => ['history', contactId],
        list: (contactId, type = 'all') => ['history', contactId, type],
    },
}

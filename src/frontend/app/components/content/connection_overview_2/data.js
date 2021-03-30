
export const ITEMS = [
    {
        id: 1, x: 0, y: 0, name: 'Get Clients', invoker: 'i-doit',
        items: [{
            id: 11, x: 0, y: 0, name: 'cmdb.objects.read', label: 'getObjects', invoker: 'i-doit'},
            {id: 22, x: 240, y: 0, name: 'cmdb.category.read', label: 'getCategories', invoker: 'i-doit'},],
        arrows: [{from: 11, to: 22}]
    },
    {
        id: 2, x: 250, y: 40, name: 'Find Tickets', invoker: 'otrs',
        items: [{id: 11, x: 0, y: 0, name: 'ConfigItemSearch', label: 'Search Items', invoker: 'otrs'},
            {id: 22, x: 240, y: 0, name: 'ConfigItemCreate', label: 'Create Items', invoker: 'otrs'},],
        arrows: [{from: 11, to: 22}]

    },
    {
        id: 3, x: 450, y: 50, type: 'if', label: 'IF'
    },
];

export const ARROWS = [
    {from: 1, to: 2},
    {from: 2, to: 3},
];

export const ITEMS = [
    {
        id: 1, x: 20, y: 40, name: 'Get Clients', invoker: 'i-doit',
        items: [{
            id: 11, x: 420, y: 20, name: 'cmdb.objects.read', label: 'getObjects', invoker: 'i-doit'},
            {id: 22, x: 240, y: 20, label: 'cmdb.category.read', invoker: 'i-doit'},],
        arrows: [{from: 11, to: 22}]
    },
    {
        id: 2, x: 250, y: 40, name: 'Find Tickets', invoker: 'otrs',
        items: [{id: 11, x: 20, y: 20, label: 'ConfigItemSearch', invoker: 'otrs'},
            {id: 22, x: 240, y: 20, label: 'ConfigItemCreate', invoker: 'otrs'},],
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
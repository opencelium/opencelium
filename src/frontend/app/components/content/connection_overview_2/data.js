/*
 * Copyright (C) <2021>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */


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
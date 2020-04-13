/*
 * Copyright (C) <2020>  <becon GmbH>
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

const incstr = require('incstr');
let ab = 'abcefghijklmnopqrstuvwxyzABCEFGHJKLMNOPQRSTUVWXYZ';
const createUniqueIdGenerator = () => {
    const uniqIds = {};

    const generateNextId = incstr.idGenerator({
        alphabet: ab,
    });

    return (name) => {
        if (!uniqIds[name]) {
            uniqIds[name] = generateNextId();
        }

        return uniqIds[name];
    };
};

const localNameIdGenerator = createUniqueIdGenerator();
const componentNameIdGenerator = createUniqueIdGenerator();

module.exports = (localName, resourcePath) => {
    const componentName = resourcePath
        .split('\\')
        .slice(-2, -1)[0];
    const fileName = resourcePath.split('\\').slice(-1)[0];
    let fileNameArr = fileName.split('.');
    let name = fileNameArr.splice(0, fileNameArr.length - 1).join('.');
    const localId = localNameIdGenerator(localName);
    const localNameId = localNameIdGenerator(name);
    const componentId = componentNameIdGenerator(componentName);
    return `${componentId}_${localNameId}_${localId}`;
};
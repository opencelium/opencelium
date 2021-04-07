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

import SecureLS from 'secure-ls';


/**
 * define Secure Local Storage variable for crypting data in local storage of the web browser
 */
let ls = new SecureLS({encodingType: 'des', isCompression: false, encryptionSecret: 'SmhaRzFwYmpKVoy'});

/**
 * set local storage variable
 */
function setLS(key, value, namespace = 'd'){
    let data = ls.get(namespace);
    if(data === ''){
        data = {};
    }
    data[key] = value;
    ls.set(namespace, data);
}

/**
 * get local storage variable
 */
function getLS(key, namespace = 'd'){
    let data = ls.get(namespace);
    if(data === ''){
        return null;
    }
    return data[key];
}

/**
 * remove local storage variable
 */
function removeLS(key, namespace = 'd'){
    let data = ls.get(namespace);
    if(data !== ''){
        delete data[key];
        ls.set(namespace, data);
    }
}

/**
 * remove all local storage variable
 */
function removeAllLS(namespace = 'd'){
    let data = ls.get(namespace);
    if(data !== '') {
        ls.remove(namespace);
    }
}

export {
    setLS,
    getLS,
    removeLS,
    removeAllLS,
};
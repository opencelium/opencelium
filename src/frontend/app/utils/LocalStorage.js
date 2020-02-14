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

import SecureLS from 'secure-ls';


/**
 * define Secure Local Storage variable for crypting data in local storage of the web browser
 */
let ls = new SecureLS({encodingType: 'des', isCompression: false, encryptionSecret: 'SmhaRzFwYmpKVoy'});

/**
 * set local storage variable
 */
function setLS(key, value){
    let data = ls.get('d');
    if(data === ''){
        data = {};
    }
    data[key] = value;
    ls.set('d', data);
}

/**
 * get local storage variable
 */
function getLS(key){
    let data = ls.get('d');
    if(data === ''){
        return null;
    }
    return data[key];
}

/**
 * remove local storage variable
 */
function removeLS(key){
    let data = ls.get('d');
    if(data !== ''){
        delete data[key];
        ls.set('d', data);
    }
}

/**
 * remove all local storage variable
 */
function removeAllLS(){
    let data = ls.get('d');
    if(data !== '') {
        ls.remove('d');
    }
}

export {
    setLS,
    getLS,
    removeLS,
    removeAllLS,
};
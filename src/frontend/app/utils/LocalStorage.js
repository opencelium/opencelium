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
let cryptLocalStorage = new SecureLS({encodingType: 'des', isCompression: false});
let localStorage = window.localStorage;

/**
 * set local storage variable
 */
function setLS(key, value){
    localStorage.setItem(key, value);
}
/**
 * set crypt local storage variable
 */
function setCryptLS(key, value, namespace = 'd'){
    let data = cryptLocalStorage.get(namespace);
    if(data === ''){
        data = {};
    }
    data[key] = value;
    cryptLocalStorage.set(namespace, data);
}

/**
 * get crypt local storage variable
 */
function getCryptLS(key, namespace = 'd'){
    let data = cryptLocalStorage.get(namespace);
    if(data === ''){
        return null;
    }
    return data[key];
}

/**
 * get local storage variable
 */
function getLS(key){
    return localStorage.getItem(key);
}

/**
 * remove crypt local storage variable
 */
function removeCryptLS(key, namespace = 'd'){
    let data = cryptLocalStorage.get(namespace);
    if(data !== ''){
        delete data[key];
        cryptLocalStorage.set(namespace, data);
    }
}

/**
 * remove local storage variable
 */
function removeLS(key){
    localStorage.removeItem(key);
}

/**
 * remove all crypt local storage variable
 */
function removeAllCryptLS(namespace = 'd'){
    let data = cryptLocalStorage.get(namespace);
    if(data !== '') {
        cryptLocalStorage.remove(namespace);
    }
}

/**
 * remove all local storage variable
 */
function removeAllLS(){
    localStorage.clear();
}

export {
    setLS,
    setCryptLS,
    getLS,
    getCryptLS,
    removeLS,
    removeCryptLS,
    removeAllLS,
    removeAllCryptLS,
};
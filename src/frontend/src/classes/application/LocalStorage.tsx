/*
 * Copyright (C) <2022>  <becon GmbH>
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
import {ILocalStorage} from "@interface/application/ILocalStorage";

export class LocalStorage implements ILocalStorage{
    private static cryptStorage: SecureLS;
    private static storage: any;
    private static instance: LocalStorage;
    isSecured: boolean;
    private constructor() {}

    static getStorage(isSecured = false): LocalStorage{
        if(!LocalStorage.instance){
            LocalStorage.instance = new LocalStorage();
        }
        LocalStorage.instance.isSecured = isSecured;
        LocalStorage.setCryptStorage();
        LocalStorage.setOpenStorage();
        return LocalStorage.instance;
    }

    static setCryptStorage(){
        if(!LocalStorage.cryptStorage){
            LocalStorage.cryptStorage = new SecureLS({encodingType: 'des', isCompression: false});
        }
        return LocalStorage.cryptStorage;
    }

    static setOpenStorage(){
        if(!LocalStorage.storage){
            LocalStorage.storage = window.localStorage;
        }
    }

    set(key: string, value: any, namespace?: string): void{
        if(LocalStorage.instance.isSecured){
            namespace = namespace ? namespace : 'g';
            let data = LocalStorage.cryptStorage.get(namespace);
            if(data === ''){
                data = {};
            }
            data[key] = value;
            LocalStorage.cryptStorage.set(namespace, data);
        } else{
            LocalStorage.storage.setItem(key, JSON.stringify(value));
        }
    }

    get(key: string, namespace?: string): any{
        if(LocalStorage.instance.isSecured){
            namespace = namespace ? namespace : 'g';
            let data = LocalStorage.cryptStorage.get(namespace);
            if(data === ''){
                return null;
            }
            return data[key];
        } else{
            return JSON.parse(LocalStorage.storage.getItem(key));
        }
    }

    remove(key: string, namespace?: string): void{
        if(LocalStorage.instance.isSecured){
            namespace = namespace ? namespace : 'g';
            let data = LocalStorage.cryptStorage.get(namespace);
            if(data !== ''){
                delete data[key];
                LocalStorage.cryptStorage.set(namespace, data);
            }
        } else{
            LocalStorage.storage.removeItem(key);
        }
    }

    removeAll(key: string, namespace?: string): void{
        if(LocalStorage.instance.isSecured){
            namespace = namespace ? namespace : 'g';
            let data = LocalStorage.cryptStorage.get(namespace);
            if(data !== '') {
                LocalStorage.cryptStorage.remove(namespace);
            }
        } else{
            LocalStorage.storage.clear();
        }
    }
}
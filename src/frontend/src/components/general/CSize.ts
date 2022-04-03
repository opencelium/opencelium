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

import {isNumber} from "../utils";
interface ISize{
    size: string,
    loadingSize: string,
}

export class CSize implements ISize{

    size = '0';
    loadingSize = '0';

    constructor(size: number | string) {
        if(isNumber(size)){
            this.size = `${size}px`;
        } else{
            this.size = `${size}`;
        }
        this.setLoadingSize();
    }

    setLoadingSize(): void{
        let clearNumber = '';
        if(this.size.length > 0){
            if(isNumber(this.size[0])){
                clearNumber += this.size[0];
                let measure = '';
                for(let i = 1; i < this.size.length; i++){
                    if(isNumber(this.size[i])){
                        clearNumber += this.size[i];
                    } else{
                        measure = this.size.substr(i);
                        break;
                    }
                }
                this.loadingSize = `${parseInt(clearNumber) * 2 / 3}${measure}`;
            }
        }
    }
}
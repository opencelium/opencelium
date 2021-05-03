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

/**
 * Class for Fields in CheckConnection
 */
export default class CFields{

    /**
     * to get counter value using the currentIndex
     */
    static getLoopLength(currentIndex, loopLengths){
        let divider = currentIndex;
        let result = '';
        for(let i = 0; i < loopLengths.length - 1; i++){
            result += '1|';
        }
        result += '1';
        result = result.split('|');
        for(let i = 0; i < loopLengths.length - 1; i++){
            const division = CFields.getMultiplication(loopLengths, i);
            let nextValue = Math.floor(divider / division);
            if(nextValue === loopLengths[i]){
                nextValue = Math.floor((divider - 1) / division);
            }
            divider = divider - nextValue * division;
            result[i] = nextValue + 1;
            if(i === loopLengths.length - 2){
                result[i + 1] = divider + 1 > loopLengths[i + 1] ? divider : divider + 1;
            }
        }
        return result.join('|');
    }

    /**
     * to multiply all elements in array starting from specific index
     */
    static getMultiplication(length, startIndex = 0){
        return length.reduce((elemA, elemB, key) => {
            if(key <= startIndex)
                return 1;
            return parseInt(elemA) * parseInt(elemB)
        }, 1);
    }
}
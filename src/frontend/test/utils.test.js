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

import {checkCronExpression, isEqualObjectParams} from "@utils/app";

describe('Regular Expression for Cron Expression ', () => {
    const truthyCronExpressions = [
        //test seconds
        '0/1 0 0 0 0 ?', '1-5 0 0 0 0 ?', '2,3 0 0 0 0 ?', '* 0 0 0 0 ?',
        //test minutes
        '* 1 0 0 0 ?', '* 59 0 0 0 ?', '* * 0 0 0 ?', '* 0/0 0 0 0 ?', '* 59/59 0 0 0 ?', '* /59 0 0 0 ?', '* */59 0 0 0 ?',
        //test hours
        '* 1 1 0 0 ?', '* 59 23,20 0 0 ?', '* * 1-3,20 0 0 ?', '* 0/0 0/0 0 0 ?', '* 59/59 23/23 0 0 ?', '* /59 /23 0 0 ?', '* */59 */23 0 0 ?',
        //test days
        '* 1 1 21 0 ?', '* 59 23 L 0 ?', '* * * W 0 ?', '* 0/0 0/0 0/0 0 ?', '* 59/59 23/23 31/31 0 ?', '* /59 /23 /31 0 ?', '* */59 */23 */31 0 ?',
        //test months
        '* 1 1 21 0 ?', '* 59 23 31 11 ?', '* * * * * ?', '* 0/0 0/0 0/0 0/0 ?', '* 59/59 23/23 31/31 11/11 ?', '* /59 /23 /31 /11 ?', '* */59 */23 */31 */11 ?',
        //test day of week
        '* 1 1 21 0 1', '* 59 23 31 11 ?', '* * * * * L', '* 0/0 0/0 0/0 0/0 #', '* 59/59 23/23 31/31 11/11 1-2,3-4,5', '* /59 /23 /31 /11 ?', '* */59 */23 */31 */11 ?',
        //test year
        '* 1 1 21 0 1 1970', '* 59 23 31 11 ? 1989-2039', '* * * * * L 2021,2022', '* 0/0 0/0 0/0 0/0 2010/2020', '* 59/59 23/23 31/31 11/11 1-2,3-4,5 *', '* /59 /23 /31 /11 ?', '* */59 */23 */31 */11 ?',
    ];
    const falsyCronExpressions = [
        //test seconds
        'a5 0 0 0 0 ?',
    ];

    for(let i = 0; i < truthyCronExpressions.length; i++){
        test(truthyCronExpressions[i], () => {
            const received = checkCronExpression(truthyCronExpressions[i]);
            expect(received).toBeTruthy();
        });
    }

    for(let i = 0; i < falsyCronExpressions.length; i++){
        test(falsyCronExpressions[i], () => {
            const received = checkCronExpression(falsyCronExpressions[i]);
            expect(received).toBeFalsy();
        });
    }
});

describe('Compare Object Params', () => {
    test('same keys different values', () => {
        let obj = {param1: {param3: 'a', param4: 'b'}, params2: '2'};
        let anotherObj = {params2: '2', param1: {param4: 'b2', param3: 'a'}};
        const received = isEqualObjectParams(obj, anotherObj);
        expect(received).toBeTruthy();
    })
    test('different keys different values', () => {
        let obj = {"test":"test","method":"idoit.version","id":"1","params":{"apikey":"{apikey}","language":"de"},"version":"2.0","one more test":"onemoretest"};
        let anotherObj = {"test":"t","method":"idoit.version","id":"1","params":{"apikey":"{apikey}","language":"de"},"version":"2.0"};
        const received = isEqualObjectParams(obj, anotherObj);
        expect(received).toBeFalsy();
    })
    test('different keys different values 2', () => {
        let obj = {
            result: {
                hardware: null,
                networking: "",
                software: ""
            }
        };
        let anotherObj = {
            result: {
                hardware: {
                    components: {
                        chassis: [{
                            model: "",
                            serial: ""
                        }]
                    }
                },
                networking: "",
                software: ""
            }
        };
        const received = isEqualObjectParams(obj, anotherObj);
        expect(received).toBeFalsy();
    })
})
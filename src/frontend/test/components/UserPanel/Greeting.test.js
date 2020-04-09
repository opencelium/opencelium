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

import React from 'react';
import {shallow} from 'enzyme';
import Greeting from "../../../app/components/content/home/Greeting";


describe('Greeting', () => {
    let component;
    let received, expected;

    beforeEach(() => {
        component = shallow(<Greeting/>).shallow();
    });
    it('should have h1', () => {
        received = component.find('h1');
        expected = 1;
        expect(received).toHaveLength(expected);
    });
    describe('h1', () => {
        let h1;
        beforeEach(() => {
            h1 = component.find('h1'); 
        });
        it('should have text', () => {
            received = h1.text();
            expected = 'Hello dear Guest';
            expect(received).toEqual(expected);
        });
    });
});
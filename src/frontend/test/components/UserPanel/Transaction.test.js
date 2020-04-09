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
import { shallow } from 'enzyme';
import {Card, CardTitle, CardText} from 'react-toolbox';
import TransactionsList from "../../../app/components/content/connections/transactions_list/TransactionsList";


describe('TransactionsList', () => {
    let component;
    let received, expected;
    beforeEach(() => {
        component = shallow(<TransactionsList/>).shallow();
    });
    it('should have Card', () => {
        received = component.find(Card);
        expected = 3;
        expect(received).toHaveLength(expected);
    });
    it('should have CardTitle', () => {
        received = component.find(Card);
        expected = 3;
        expect(received).toHaveLength(expected);
    });
});
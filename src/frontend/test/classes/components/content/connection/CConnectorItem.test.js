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
import CConnectorItem from "../../../../../app/classes/components/content/connection/CConnectorItem";


describe('Add Method', () => {
    let connectorItem = CConnectorItem.createConnectorItem();
    beforeEach(() => {
        connectorItem.title = 'i-doit';
        connectorItem.setConnectorType('fromConnector');
        connectorItem.methods = [
            {index: '0'},
            {index: '1'},
            {index: '2_0'},
            {index: '2_1'},
            {index: '2_2'},
            {index: '3'},
            {index: '4'},
            {index: '5'},
        ];
        connectorItem.operators = [
            {index: '2'},
        ];
    });

    it('should NOT be the last method in the subtree', () => {
        expect(connectorItem.isLastItemInTheTree('1')).toBeFalsy();
    });

    it('should NOT be the last method in the subtree', () => {
        expect(connectorItem.isLastItemInTheTree('2_0')).toBeFalsy();
    });

    it('should NOT be the last method in the subtree', () => {
        expect(connectorItem.isLastItemInTheTree('2_1')).toBeFalsy();
    });

    it('should be the last method in the subtree', () => {
        expect(connectorItem.isLastItemInTheTree('2_2')).toBeTruthy();
    });

    it('should NOT be the last method in the subtree', () => {
        expect(connectorItem.isLastItemInTheTree('4')).toBeFalsy();
    });

    it('should be the last method in the subtree', () => {
        expect(connectorItem.isLastItemInTheTree('5')).toBeTruthy();
    });
});
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
import CConnectorItem, {INSIDE_ITEM} from "../../../../../app/classes/components/content/connection/CConnectorItem";
import {ALL_COLORS} from "../../../../../app/classes/components/content/connection/CConnection";


describe.skip('Add Method', () => {
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


describe.skip('Check OperatorsHistory', () => {
    let connectorItem = CConnectorItem.createConnectorItem();
    beforeEach(() => {
        connectorItem.methods = [];
        connectorItem.operators = [];
    });

    it('should NOT have any element', () => {
        connectorItem.addMethod({name: 'method', color: ALL_COLORS[0]});
        expect(connectorItem.operatorsHistory.length).toBe(0);
    });

    it('should NOT have any element', () => {
        connectorItem.addMethod({name: 'method', color: ALL_COLORS[0]});
        connectorItem.addOperator({type: 'if'});
        expect(connectorItem.operatorsHistory.length).toBe(0);
    });

    it('should have one element with index "1"', () => {
        connectorItem.addMethod({name: 'method', color: ALL_COLORS[0]});
        connectorItem.addOperator({type: 'if'});
        connectorItem.addMethod({name: 'method 2', color: ALL_COLORS[1]}, INSIDE_ITEM);
        expect(connectorItem.operatorsHistory.length).toBe(1);
        expect(connectorItem.operatorsHistory[0].index).toBe('1');
    });

    it('should have two elements with index "1" and "1_1"', () => {
        connectorItem.addMethod({name: 'method', color: ALL_COLORS[0]});
        connectorItem.addOperator({type: 'if'});
        connectorItem.addMethod({name: 'method 2', color: ALL_COLORS[1]}, INSIDE_ITEM);
        connectorItem.addOperator({type: 'if'});
        connectorItem.addMethod({name: 'method 2', color: ALL_COLORS[2]}, INSIDE_ITEM);
        expect(connectorItem.operatorsHistory.length).toBe(2);
        expect(connectorItem.operatorsHistory[0].index).toBe('1');
        expect(connectorItem.operatorsHistory[1].index).toBe('1_1');
    });
});

describe.skip('Check Iterators', () => {
    let connectorItem = CConnectorItem.createConnectorItem();
    beforeEach(() => {
        connectorItem.methods = [];
        connectorItem.operators = [];
    });

    it('first operator should be \'i\'', () => {
        connectorItem.addOperator({type: 'loop'});
        expect(connectorItem.operators[0].iterator).toBe('i');
    });

    it('second operator should be \'i\'', () => {
        connectorItem.addOperator({type: 'loop'});
        connectorItem.addOperator({type: 'loop'});
        expect(connectorItem.operators[1].iterator).toBe('i');
    });

    it('second operator should be \'j\'', () => {
        connectorItem.addOperator({type: 'loop'});
        connectorItem.addOperator({type: 'loop'}, INSIDE_ITEM);
        expect(connectorItem.operators[1].iterator).toBe('j');
    });

    it('third operator should be \'k\'', () => {
        connectorItem.addOperator({type: 'loop'});
        connectorItem.addOperator({type: 'loop'}, INSIDE_ITEM);
        connectorItem.addOperator({type: 'loop'}, INSIDE_ITEM);
        console.log(connectorItem.operators[2].iterator);
        expect(connectorItem.operators[2].iterator).toBe('k');
    });
});
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

import React from 'react';
import CConnectorItem from "../../../../../app/classes/components/content/connection/CConnectorItem";
import CConnectorPagination from "../../../../../app/classes/components/content/connection/CConnectorPagination";
import {ALL_COLORS} from "../../../../../app/classes/components/content/connection/CConnection";


describe.skip('Load Pages', () => {
    let connectorItem = CConnectorItem.createConnectorItem();
    beforeEach(() => {
        connectorItem.title = 'i-doit';
        connectorItem.setConnectorType('fromConnector');
        connectorItem.addMethod({name: 'idoit.version', color: ALL_COLORS[0]});
        connectorItem.addMethod({name: 'idoit.version', color: ALL_COLORS[1]});
        connectorItem.addMethod({name: 'idoit.version', color: ALL_COLORS[2]});
        connectorItem.addMethod({name: 'idoit.version', color: ALL_COLORS[3]});
        connectorItem.addMethod({name: 'idoit.version', color: ALL_COLORS[4]});
        connectorItem.addMethod({name: 'idoit.version', color: ALL_COLORS[5]});
        connectorItem.addMethod({name: 'idoit.version', color: ALL_COLORS[6]});
        connectorItem.addMethod({name: 'idoit.version', color: ALL_COLORS[7]});
        connectorItem.addMethod({name: 'idoit.version', color: ALL_COLORS[8]});
        connectorItem.addMethod({name: 'idoit.version', color: ALL_COLORS[9]});
    });

    afterEach(() => {
        connectorItem = CConnectorItem.createConnectorItem();
    });

    it('Pagination should increase its currentPageNumber', () => {
        connectorItem.addMethod({name: 'cmdb', color: ALL_COLORS[10]});
        expect(connectorItem.pagination.currentPageNumber).toEqual(2);
    });

    it('Pagination should decrease its currentPageNumber', () => {
        connectorItem.addMethod({name: 'cmdb', color: ALL_COLORS[10]});
        let currentItem = connectorItem.getCurrentItem();
        connectorItem.removeMethod(currentItem);
        expect(connectorItem.pagination.currentPageNumber).toEqual(1);
    });
});
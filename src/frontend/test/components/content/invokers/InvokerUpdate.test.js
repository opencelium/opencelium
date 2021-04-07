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
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import {BrowserRouter as Router} from "react-router-dom";
import renderer from 'react-test-renderer';
import {fromJS} from "immutable";
import InvokerUpdate from "../../../../app/components/content/invokers/update/InvokerUpdate";

//const mockStore = configureStore([]);

describe('Render InvokerUpdate Component', () => {
    test('it should show a subscription message', () => {
        const component = renderer.create(
            <InvokerUpdate/>
        );
        let tree = component.toJSON();
        expect(tree).toMatchSnapshot();
    });
});
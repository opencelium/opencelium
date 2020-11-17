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

import React, { Component }  from 'react';
import {connect} from 'react-redux';
import {deleteInvoker} from "@actions/invokers/delete";
import {LayoutComponent} from "@decorators/LayoutComponent";


/**
 * Layout for Connectors
 */
@connect(null, {deleteInvoker})
@LayoutComponent('invoker', 'invokers', 'invokers')
class InvokerLayout extends Component{

    render(){
        return null;
    }
}

export default InvokerLayout;

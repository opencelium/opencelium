/*
 * Copyright (C) <2019>  <becon GmbH>
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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Table as ToolboxTable} from 'react-toolbox/lib/table';
import styles from '../../../../themes/default/general/basic_components.scss';
import {getThemeClass} from "../../../../utils/app";


/**
 * Table Component
 */
class Table extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {authUser, ...props} = this.props;
        let {className} = this.props;
        let classNames = [
            'table',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        className = `${className} ${styles[classNames.table]}`;
        return (
            <ToolboxTable {...props} className={className}>
                {this.props.children}
            </ToolboxTable>
        );
    }
}

Table.propTypes = {
    authUser: PropTypes.object.isRequired,
};

Table.defaultProps = {
    className: '',
};

export default Table;
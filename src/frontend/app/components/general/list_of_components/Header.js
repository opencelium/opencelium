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

import React, {Component} from 'react';

import ContentHeader from '../content/ContentHeader';

import styles from '@themes/default/general/list_of_components.scss';

/**
 * Header for List of Components
 */
class ListHeader extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {header, icons} = this.props;
        return (
            <ContentHeader header={header} icons={icons} className={styles.list_header}/>
        );
    }
}

ListHeader.defaultProps = {
    icons: [],
}


export default ListHeader;
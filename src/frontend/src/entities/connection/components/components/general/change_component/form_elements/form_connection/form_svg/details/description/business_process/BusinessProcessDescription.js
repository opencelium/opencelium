/*
 * Copyright (C) <2022>  <becon GmbH>
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
import {connect} from 'react-redux';
import {Row} from "react-grid-system";
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import Label from "@change_component/form_elements/form_connection/form_svg/details/description/technical_process/Label";
import {setCurrentBusinessItem} from "@entity/connection/redux_toolkit/slices/ConnectionSlice";

@connect(null, {setCurrentBusinessItem})
class BusinessProcessDescription extends React.Component{
    constructor(props) {
        super(props);
    }

    changeLabel(label){
        const {connection, details, updateConnection, setCurrentBusinessItem} = this.props;
        connection.businessLayout.changeItemName(details, label);
        const currentBusinessItem = connection.businessLayout.getItemById(details.id);
        updateConnection(connection);
        if(currentBusinessItem) setCurrentBusinessItem(currentBusinessItem.getObject());
    }

    render(){
        const label = this.props.details.name;
        return(
            <Row className={styles.row}>
                <Label {...this.props} label={label} changeLabel={(a) => this.changeLabel(a)} text={'Name'}/>
            </Row>
        );
    }
}

export default BusinessProcessDescription;
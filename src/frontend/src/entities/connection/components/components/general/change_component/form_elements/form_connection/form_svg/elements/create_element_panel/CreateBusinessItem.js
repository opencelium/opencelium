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

import ReactDOM from "react-dom";
import React from 'react';
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import Input from "@entity/connection/components/components/general/basic_components/inputs/Input";
import {
    Line,
} from "@change_component/form_elements/form_connection/form_svg/elements/create_element_panel/Lines";
import {CreateIcon} from "@change_component/form_elements/form_connection/form_svg/elements/create_element_panel/CreateIcon";
import {setFocusById} from "@application/utils/utils";
import {connect} from "react-redux";
import {setCurrentBusinessItem} from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import {CBusinessProcess} from "@entity/connection/components/classes/components/content/connection_overview_2/process/CBusinessProcess";
import CCreateElementPanel from "@entity/connection/components/classes/components/content/connection_overview_2/CCreateElementPanel";


@connect(null, {setCurrentBusinessItem})
class CreateBusinessItem extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            name: '',
        }
    }

    componentDidMount() {
        setFocusById('new_business_item_name');
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        let currentCoordinates = CCreateElementPanel.getCoordinates(this.props);
        let prevCoordinates = CCreateElementPanel.getCoordinates(prevProps);
        if((currentCoordinates.x === 0 && currentCoordinates.y === 0) || prevCoordinates.x !== currentCoordinates.x || prevCoordinates.y !== currentCoordinates.y){
            if(this.state.name !== '') {
                this.setState({
                    name: '',
                });
            }
        }
    }

    changeName(name){
        this.setState({
            name,
        });
    }

    onKeyDown(e){
        if(e.keyCode === 13){
            this.create();
        }
    }

    create(){
        const {name} = this.state;
        if(name) {
            const {connection, updateConnection, setCreateElementPanelPosition, setIsCreateElementPanelOpened, setCurrentBusinessItem} = this.props;
            const currentSvgItem = connection.businessLayout.getCurrentSvgItem();
            const x = currentSvgItem ? currentSvgItem.x + currentSvgItem.width + 20 : 100;
            const y = currentSvgItem ? currentSvgItem.y : 100;
            connection.businessLayout.addItem({name, x, y});
            updateConnection(connection);
            setCurrentBusinessItem(connection.businessLayout.getCurrentSvgItem().getObject());
            if (setCreateElementPanelPosition) setCreateElementPanelPosition({x: 0, y: 0});
            if (setIsCreateElementPanelOpened) setIsCreateElementPanelOpened(false);
        } else{
            setFocusById('new_business_item_name');
        }
    }

    render(){
        const {name} = this.state;
        let {connection, isTypeCreateOperator} = this.props;
        let {x, y} = CCreateElementPanel.getCoordinates(this.props);
        const isInitialState = connection.businessLayout.getItems().length === 0;
        if(!isInitialState){
            y -= 100;
        }
        let {createIconStyles, afterItemLineStyles, panelItemStyles} = CBusinessProcess.getCreateElementPanelStyles(x, y, {isTypeCreateOperator});
        const isAddDisabled = name === '';
        return(
            <React.Fragment>
                <div className={styles.create_element_panel_for_item} style={panelItemStyles}>
                    <Input id={'new_business_item_name'} theme={{input: styles.input_label}} onChange={(a) => this.changeName(a)} onKeyDown={(a) => this.onKeyDown(a)} value={name} label={'Name'}/>
                </div>
                <Line style={afterItemLineStyles}/>
                <CreateIcon create={(a) => this.create(a)} style={createIconStyles} isDisabled={isAddDisabled}/>
            </React.Fragment>
        );
    }
}

export default CreateBusinessItem;
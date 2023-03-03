/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react';
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import Select from "@entity/connection/components/components/general/basic_components/inputs/Select";
import {CONNECTOR_FROM} from "@entity/connection/components/classes/components/content/connection/CConnectorItem";
import COperatorItem from "@entity/connection/components/classes/components/content/connection/operator/COperatorItem";
import {
    Line,
} from "@change_component/form_elements/form_connection/form_svg/elements/create_element_panel/Lines";
import {CreateIcon} from "@change_component/form_elements/form_connection/form_svg/elements/create_element_panel/CreateIcon";
import CCreateElementPanel from "@entity/connection/components/classes/components/content/connection_overview_2/CCreateElementPanel";
import {CTechnicalProcess} from "@entity/connection/components/classes/components/content/connection_overview_2/process/CTechnicalProcess";
import {setFocusById} from "@application/utils/utils";
import {connect} from "react-redux";
import {setJustCreatedItem} from "@root/redux_toolkit/slices/ConnectionSlice";


@connect(null, {setJustCreatedItem})
class CreateOperator extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            type: null,
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        let currentCoordinates = CCreateElementPanel.getCoordinates(this.props);
        let prevCoordinates = CCreateElementPanel.getCoordinates(prevProps);
        if((currentCoordinates.x === 0 && currentCoordinates.y === 0)
            || prevCoordinates.x !== currentCoordinates.x || prevCoordinates.y !== currentCoordinates.y){
            if(this.state.type !== null) {
                this.setState({
                    type: null,
                });
            }
        }
    }

    changeType(type){
        this.setState({
            type,
        });
    }

    onKeyDown(e){
        if(e.keyCode === 13){
            this.create();
        }
    }

    create(){
        let {type} = this.state;
        const {setJustCreatedItem} = this.props;
        if(type) {
            type = type.value;
            const {connection, updateConnection, setCreateElementPanelPosition, itemPosition, setIsCreateElementPanelOpened} = this.props;
            let connectorType = CCreateElementPanel.getConnectorType(this.props);
            let operator = {type};
            let newOperator;
            if (connectorType === CONNECTOR_FROM) {
                newOperator = connection.addFromConnectorOperator(operator, itemPosition);
            } else {
                newOperator = connection.addToConnectorOperator(operator, itemPosition);
            }
            setJustCreatedItem({index: newOperator.index, connectorType})
            updateConnection(connection);
            setCreateElementPanelPosition({x: 0, y: 0});
            setIsCreateElementPanelOpened(false);
            setTimeout(() => {setJustCreatedItem(null)}, 800)
        } else{
            setFocusById('new_operator_type');
        }
    }

    render(){
        const {type} = this.state;
        const {selectedItem, isTypeCreateOperator, createElementPanelConnectorType, itemPosition, itemType} = this.props;
        let {x, y} = CCreateElementPanel.getCoordinates(this.props);
        const isOnlyOneCreateElement = !!itemPosition && !!itemPosition;
        const {isInTechnicalFromConnectorLayout, isInTechnicalToConnectorLayout} = CCreateElementPanel.getLocationData(createElementPanelConnectorType);
        let ItemClass = selectedItem;
        if(selectedItem === null){
            if(isInTechnicalFromConnectorLayout || isInTechnicalToConnectorLayout){
                ItemClass = CTechnicalProcess;
            }
        }
        let {createIconStyles, afterItemLineStyles, beforeItemLineStyles, panelItemStyles} = ItemClass.getCreateElementPanelStyles(x, y, {isOnlyOneCreateElement, isTypeCreateOperator});
        const typeSource = COperatorItem.getOperatorTypesForSelect();
        const isAddDisabled = type === null;
        return(
            <React.Fragment>
                {!itemPosition && !itemType ? <Line style={beforeItemLineStyles}/> : null}
                <div className={styles.create_element_panel_for_item} style={panelItemStyles}>
                    <Select
                        id={'new_operator_type'}
                        name={'new_operator_type'}
                        value={type}
                        onChange={(a) => this.changeType(a)}
                        onKeyDown={(a) => this.onKeyDown(a)}
                        options={typeSource}
                        closeOnSelect={false}
                        placeholder={'Type'}
                        maxMenuHeight={200}
                        minMenuHeight={50}
                        label={'Type'}
                        className={styles.input_label}
                        required={true}
                    />
                </div>
                <Line style={afterItemLineStyles}/>
                <CreateIcon create={(a) => this.create(a)} style={createIconStyles} isDisabled={isAddDisabled}/>
            </React.Fragment>
        );
    }
}

export default CreateOperator;
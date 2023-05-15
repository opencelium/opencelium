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
import {setFocusById} from "@application/utils/utils";
import {setArrows} from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import {connect} from "react-redux";
import CreateProcess
    from "@change_component/form_elements/form_connection/form_svg/elements/create_element_panel/CreateProcess";
import CreateOperator
    from "@change_component/form_elements/form_connection/form_svg/elements/create_element_panel/CreateOperator";
import {
    OUTSIDE_ITEM
} from "@entity/connection/components/classes/components/content/connection/CConnectorItem";
import CCreateElementPanel, {
    CREATE_OPERATOR,
    CREATE_PROCESS
} from "@entity/connection/components/classes/components/content/connection_overview_2/CCreateElementPanel";
import {mapItemsToClasses} from "@change_component/form_elements/form_connection/form_svg/utils";
import {CTechnicalProcess} from "@entity/connection/components/classes/components/content/connection_overview_2/process/CTechnicalProcess";
import {CTechnicalOperator} from "@entity/connection/components/classes/components/content/connection_overview_2/operator/CTechnicalOperator";
import ItemTypePanel
    from "@change_component/form_elements/form_connection/form_svg/elements/create_element_panel/ItemTypePanel";
import ItemPositionPanel
    from "@change_component/form_elements/form_connection/form_svg/elements/create_element_panel/ItemPositionPanel";
import ReactDOM from "react-dom";
import GetModalProp from '@entity/connection/components/decorators/GetModalProp';


function mapStateToProps(state, props){
    const {currentTechnicalItem} = mapItemsToClasses(state, props.isModal);
    return{
        currentTechnicalItem,
    };
}

@GetModalProp()
@connect(mapStateToProps, {setArrows})
class CreateElementPanel extends React.Component{
    constructor(props) {
        super(props);
        this.createElementPanel = document.createElement('div');
        this.state = {
            localType: props.type,
            localItemPosition: props.itemPosition,
        }
        document.body.appendChild(this.createElementPanel);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(prevProps.type !== this.props.type) {
            if (this.props.type !== this.state.localType) {
                this.setState({
                    localType: this.props.type,
                    localItemPosition: this.props.itemPosition,
                })
            }
        }
        if((this.props.x === 0 && this.props.y === 0 && this.props.createElementPanelConnectorType === '')
        /*|| prevProps.x !== this.props.x || prevProps.y !== this.props.y*/){
            if(this.state.localType !== CREATE_PROCESS || this.state.localItemPosition !== OUTSIDE_ITEM) {
                this.setState({
                    localItemPosition: OUTSIDE_ITEM,
                    localType: CREATE_PROCESS,
                })
            }
        }
    }

    componentWillUnmount(){
        if(this.createElementPanel) {
            document.body.removeChild(this.createElementPanel);
        }
    }

    changeType(localType){
        if(localType === CREATE_PROCESS){
            setFocusById('new_request_name');
        }
        if(localType === CREATE_OPERATOR){
            setFocusById('new_operator_type');
        }
        this.setState({localType})
    }

    onChangeItemPosition(localItemPosition){
        this.setState({
            localItemPosition,
        })
    }

    render(){
        const {localType, localItemPosition} = this.state
        const {isCreateElementPanelOpened, createElementPanelConnectorType, type, itemPosition} = this.props;
        let {x, y} = this.props;
        if(!isCreateElementPanelOpened || (x === 0 && y === 0 && createElementPanelConnectorType === '')){
            return null;
        }
        let {currentTechnicalItem, connection} = this.props;
        const {hasLocation, isInTechnicalFromConnectorLayout, isInTechnicalToConnectorLayout} = CCreateElementPanel.getLocationData(createElementPanelConnectorType);
        let selectedItem = null;
        if(!hasLocation){
            selectedItem = currentTechnicalItem !== null ? currentTechnicalItem : null;
        }
        let noOperatorType = isInTechnicalFromConnectorLayout;
        const isSelectedItemTechnicalOperator = selectedItem !== null && selectedItem instanceof CTechnicalOperator;
        const isSelectedItemTechnicalProcess = selectedItem !== null && selectedItem instanceof CTechnicalProcess;
        const isTypeCreateOperator = localType === CREATE_OPERATOR;
        const isTypeCreateProcess = !isTypeCreateOperator ? localType === CREATE_PROCESS || !type : false;

        const isSelectedItemOperator = isSelectedItemTechnicalOperator;
        const isSelectedItemTechnical = isSelectedItemTechnicalOperator || isSelectedItemTechnicalProcess;
        const isForCreateTechnicalItem = isInTechnicalFromConnectorLayout || isInTechnicalToConnectorLayout || isSelectedItemTechnical;

        const hasItemPositionPanel = isForCreateTechnicalItem && isSelectedItemOperator && !itemPosition;
        let hasItemTypePanel = isForCreateTechnicalItem && !type;
        let isFromConnectorEmpty = connection.fromConnector.svgItems.length === 0;
        if(isInTechnicalFromConnectorLayout || isInTechnicalToConnectorLayout && isFromConnectorEmpty){
            hasItemTypePanel = false;
        }
        const hasCreateProcess = isForCreateTechnicalItem && isTypeCreateProcess;
        const hasCreateOperator = isForCreateTechnicalItem && isTypeCreateOperator;
        const hasLineBeforeItemTypePanel = hasItemPositionPanel;
        const hasLineBeforeCreateProcess = hasItemTypePanel || hasItemPositionPanel;
        return(
            ReactDOM.createPortal(
                <div>
                    {hasItemPositionPanel &&
                        <ItemPositionPanel
                            {...this.props}
                            itemPosition={localItemPosition}
                            onChangeItemPosition={(a) => this.onChangeItemPosition(a)}
                        />
                    }
                    {hasItemTypePanel &&
                        <ItemTypePanel
                            {...this.props}
                            type={localType}
                            changeType={(a) => this.changeType(a)}
                            selectedItem={selectedItem}
                            noOperatorType={noOperatorType}
                            hasBeforeLine={hasLineBeforeItemTypePanel}
                        />
                    }
                    {hasCreateProcess &&
                        <CreateProcess
                            {...this.props}
                            hasBeforeLine={hasLineBeforeCreateProcess}
                            itemPosition={itemPosition}
                            itemType={type}
                            selectedItem={selectedItem}
                            isTypeCreateOperator={isTypeCreateOperator}
                        />
                    }
                    {hasCreateOperator &&
                        <CreateOperator
                            {...this.props}
                            itemType={type}
                            itemPosition={itemPosition}
                            selectedItem={selectedItem}
                            isTypeCreateOperator={isTypeCreateOperator}
                        />
                    }
                </div>,
                this.createElementPanel
            )
        );
    }
}

CreateElementPanel.defaultProps = {
    isOnTheTopLayout: false,
}

export default CreateElementPanel;
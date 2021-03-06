/*
 *  Copyright (C) <2022>  <becon GmbH>
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
import CreateBusinessItem
    from "@change_component/form_elements/form_connection/form_svg/elements/create_element_panel/CreateBusinessItem";
import {CBusinessProcess} from "@entity/connection/components/classes/components/content/connection_overview_2/process/CBusinessProcess";
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



function mapStateToProps(state){
    const {currentTechnicalItem, currentBusinessItem} = mapItemsToClasses(state);
    return{
        currentTechnicalItem,
        currentBusinessItem,
    };
}

@connect(mapStateToProps, {setArrows})
class CreateElementPanel extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            type: CREATE_PROCESS,
            itemPosition: OUTSIDE_ITEM,
        }
        this.createElementPanel = document.createElement('div');
        document.body.appendChild(this.createElementPanel);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if((this.props.x === 0 && this.props.y === 0 && this.props.createElementPanelConnectorType === '')
        || prevProps.x !== this.props.x || prevProps.y !== this.props.y){
            if(this.state.type !== CREATE_PROCESS || this.state.itemPosition !== OUTSIDE_ITEM) {
                this.setState({
                    type: CREATE_PROCESS,
                    itemPosition: OUTSIDE_ITEM,
                });
            }
        }
    }

    componentWillUnmount(){
        if(this.createElementPanel) {
            document.body.removeChild(this.createElementPanel);
        }
    }

    changeType(type){
        if(type === CREATE_PROCESS){
            setFocusById('new_request_name');
        }
        if(type === CREATE_OPERATOR){
            setFocusById('new_operator_type');
        }
        this.setState({
            type,
        });
    }

    onChangeItemPosition(itemPosition){
        this.setState({
            itemPosition,
        })
    }

    render(){
        const {isCreateElementPanelOpened, createElementPanelConnectorType} = this.props;
        let {x, y} = this.props;
        if(!isCreateElementPanelOpened || (x === 0 && y === 0 && createElementPanelConnectorType === '')){
            return null;
        }
        const {type, itemPosition} = this.state;
        let {currentTechnicalItem, currentBusinessItem, connection} = this.props;
        const {hasLocation, isInBusinessLayout, isInTechnicalFromConnectorLayout, isInTechnicalToConnectorLayout} = CCreateElementPanel.getLocationData(createElementPanelConnectorType);
        let selectedItem = null;
        if(!hasLocation){
            selectedItem = currentTechnicalItem !== null ? currentTechnicalItem : currentBusinessItem;
        }
        let noOperatorType = isInTechnicalFromConnectorLayout;
        const isSelectedItemTechnicalOperator = selectedItem !== null && selectedItem instanceof CTechnicalOperator;
        const isSelectedItemTechnicalProcess = selectedItem !== null && selectedItem instanceof CTechnicalProcess;
        const isSelectedItemBusinessProcess = selectedItem !== null && selectedItem instanceof CBusinessProcess;
        const isTypeCreateOperator = type === CREATE_OPERATOR;
        const isTypeCreateProcess = type === CREATE_PROCESS;

        const isSelectedItemOperator = isSelectedItemTechnicalOperator;
        const isSelectedItemTechnical = isSelectedItemTechnicalOperator || isSelectedItemTechnicalProcess;
        const isForCreateTechnicalItem = isInTechnicalFromConnectorLayout || isInTechnicalToConnectorLayout || isSelectedItemTechnical;

        let isForCreateBusinessItem = isInBusinessLayout || isSelectedItemBusinessProcess;
        const hasCreateBusinessItem = isForCreateBusinessItem;
        const hasItemPositionPanel = isForCreateTechnicalItem && isSelectedItemOperator;
        let hasItemTypePanel = isForCreateTechnicalItem;
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
                    {hasCreateBusinessItem &&
                        <CreateBusinessItem
                            {...this.props}
                            itemPosition={itemPosition}
                            selectedItem={selectedItem}
                            isTypeCreateOperator={isTypeCreateOperator}
                        />
                    }
                    {hasItemPositionPanel &&
                        <ItemPositionPanel
                            {...this.props}
                            itemPosition={itemPosition}
                            onChangeItemPosition={(a) => this.onChangeItemPosition(a)}
                        />
                    }
                    {hasItemTypePanel &&
                        <ItemTypePanel
                            {...this.props}
                            type={type}
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
                            selectedItem={selectedItem}
                            isTypeCreateOperator={isTypeCreateOperator}
                        />
                    }
                    {hasCreateOperator &&
                        <CreateOperator
                            {...this.props}
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
    isBusinessLayout: false,
}

export default CreateElementPanel;
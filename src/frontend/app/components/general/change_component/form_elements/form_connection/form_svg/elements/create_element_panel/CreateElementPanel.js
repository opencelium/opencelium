import React from 'react';
import {setFocusById} from "@utils/app";
import {setArrows} from "@actions/connection_overview_2/set";
import {connect} from "react-redux";
import CreateProcess
    from "@change_component/form_elements/form_connection/form_svg/elements/create_element_panel/CreateProcess";
import CreateOperator
    from "@change_component/form_elements/form_connection/form_svg/elements/create_element_panel/CreateOperator";
import {
    OUTSIDE_ITEM
} from "@classes/components/content/connection/CConnectorItem";
import CreateBusinessItem
    from "@change_component/form_elements/form_connection/form_svg/elements/create_element_panel/CreateBusinessItem";
import {CBusinessProcess} from "@classes/components/content/connection_overview_2/process/CBusinessProcess";
import CCreateElementPanel, {
    CREATE_OPERATOR,
    CREATE_PROCESS
} from "@classes/components/content/connection_overview_2/CCreateElementPanel";
import {mapItemsToClasses} from "@change_component/form_elements/form_connection/form_svg/utils";
import {CTechnicalProcess} from "@classes/components/content/connection_overview_2/process/CTechnicalProcess";
import {CTechnicalOperator} from "@classes/components/content/connection_overview_2/operator/CTechnicalOperator";
import ItemTypePanel
    from "@change_component/form_elements/form_connection/form_svg/elements/create_element_panel/ItemTypePanel";
import ItemPositionPanel
    from "@change_component/form_elements/form_connection/form_svg/elements/create_element_panel/ItemPositionPanel";



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
                        onChangeItemPosition={::this.onChangeItemPosition}
                    />
                }
                {hasItemTypePanel &&
                    <ItemTypePanel
                        {...this.props}
                        type={type}
                        changeType={::this.changeType}
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
            </div>
        );
    }
}

CreateElementPanel.defaultProps = {
    isOnTheTopLayout: false,
    isBusinessLayout: false,
}

export default CreateElementPanel;
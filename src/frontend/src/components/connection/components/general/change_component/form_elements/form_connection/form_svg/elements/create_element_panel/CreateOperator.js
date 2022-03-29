import React from 'react';
import styles from "@themes/default/content/connections/connection_overview_2";
import Select from "@basic_components/inputs/Select";
import {CONNECTOR_FROM} from "@classes/components/content/connection/CConnectorItem";
import COperatorItem from "@classes/components/content/connection/operator/COperatorItem";
import {
    Line,
} from "@change_component/form_elements/form_connection/form_svg/elements/create_element_panel/Lines";
import {CreateIcon} from "@change_component/form_elements/form_connection/form_svg/elements/create_element_panel/CreateIcon";
import CCreateElementPanel from "@classes/components/content/connection_overview_2/CCreateElementPanel";
import {CBusinessProcess} from "@classes/components/content/connection_overview_2/process/CBusinessProcess";
import {CTechnicalProcess} from "@classes/components/content/connection_overview_2/process/CTechnicalProcess";
import {setFocusById} from "@utils/app";


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
        if(type) {
            type = type.value;
            const {connection, updateConnection, setCreateElementPanelPosition, itemPosition, setIsCreateElementPanelOpened} = this.props;
            let connectorType = CCreateElementPanel.getConnectorType(this.props);
            let operator = {type};
            if (connectorType === CONNECTOR_FROM) {
                connection.addFromConnectorOperator(operator, itemPosition);
            } else {
                connection.addToConnectorOperator(operator, itemPosition);
            }
            updateConnection(connection);
            setCreateElementPanelPosition({x: 0, y: 0});
            setIsCreateElementPanelOpened(false);
        } else{
            setFocusById('new_operator_type');
        }
    }

    render(){
        const {type} = this.state;
        const {selectedItem, isTypeCreateOperator, createElementPanelConnectorType} = this.props;
        let {x, y} = CCreateElementPanel.getCoordinates(this.props);
        const {isInBusinessLayout,isInTechnicalFromConnectorLayout, isInTechnicalToConnectorLayout} = CCreateElementPanel.getLocationData(createElementPanelConnectorType);
        let ItemClass = selectedItem;
        if(selectedItem === null){
            if(isInBusinessLayout){
                ItemClass = CBusinessProcess;
            }
            if(isInTechnicalFromConnectorLayout || isInTechnicalToConnectorLayout){
                ItemClass = CTechnicalProcess;
            }
        }
        let {createIconStyles, afterItemLineStyles, beforeItemLineStyles, panelItemStyles} = ItemClass.getCreateElementPanelStyles(x, y, {isTypeCreateOperator});
        const typeSource = COperatorItem.getOperatorTypesForSelect();
        const isAddDisabled = type === null;
        return(
            <React.Fragment>
                <Line style={beforeItemLineStyles}/>
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
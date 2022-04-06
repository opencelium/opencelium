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
import styles from "@themes/default/content/connections/connection_overview_2";
import Select from "@basic_components/inputs/Select";
import Input from "@basic_components/inputs/Input";
import {CONNECTOR_FROM, CONNECTOR_TO} from "@classes/components/content/connection/CConnectorItem";
import {
    Line,
} from "@change_component/form_elements/form_connection/form_svg/elements/create_element_panel/Lines";
import {CreateIcon} from "@change_component/form_elements/form_connection/form_svg/elements/create_element_panel/CreateIcon";
import {setFocusById} from "@utils/app";
import {CBusinessProcess} from "@classes/components/content/connection_overview_2/process/CBusinessProcess";
import {CTechnicalProcess} from "@classes/components/content/connection_overview_2/process/CTechnicalProcess";
import CCreateElementPanel from "@classes/components/content/connection_overview_2/CCreateElementPanel";


class CreateProcess extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            name: '',
            label: '',
        }
    }

    componentDidMount() {
        setFocusById('new_request_name');
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        let currentCoordinates = CCreateElementPanel.getCoordinates(this.props);
        let prevCoordinates = CCreateElementPanel.getCoordinates(prevProps);
        if((currentCoordinates.x === 0 && currentCoordinates.y === 0) || prevCoordinates.x !== currentCoordinates.x || prevCoordinates.y !== currentCoordinates.y){
            if(this.state.name !== '' && this.state.label !== '') {
                this.setState({
                    name: '',
                    label: '',
                });
            }
        }
    }

    changeName(name){
        this.setState({
            name,
        });
    }

    changeLabel(label){
        this.setState({
            label,
        });
    }

    onKeyDown(e){
        if(e.keyCode === 13){
            this.create();
        }
    }

    create(){
        let {name, label} = this.state;
        if(name) {
            name = name.value;
            const {connection, updateConnection, setCreateElementPanelPosition, itemPosition, setIsCreateElementPanelOpened} = this.props;
            let connectorType = CCreateElementPanel.getConnectorType(this.props);
            const connector = connection.getConnectorByType(connectorType);
            let method = {name, label};
            let operation = connector.invoker.operations.find(o => o.name === name);
            method.request = operation.request.getObject({bodyOnlyConvert: true});
            method.response = operation.response.getObject({bodyOnlyConvert: true});
            if (connectorType === CONNECTOR_FROM) {
                connection.addFromConnectorMethod(method, itemPosition);
            } else {
                connection.addToConnectorMethod(method, itemPosition);
            }
            updateConnection(connection);
            if (setCreateElementPanelPosition) setCreateElementPanelPosition({x: 0, y: 0});
            if (setIsCreateElementPanelOpened) setIsCreateElementPanelOpened(false);
        } else{
            setFocusById('new_request_name')
        }
    }

    render(){
        const {name, label} = this.state;
        const {connection, selectedItem, isTypeCreateOperator, createElementPanelConnectorType, hasBeforeLine} = this.props;
        let connectorType = CCreateElementPanel.getConnectorType(this.props);
        const {isInBusinessLayout,isInTechnicalFromConnectorLayout, isInTechnicalToConnectorLayout} = CCreateElementPanel.getLocationData(createElementPanelConnectorType);
        let {x, y} = CCreateElementPanel.getCoordinates(this.props);
        let ItemClass = selectedItem;
        if(selectedItem === null){
            if(isInBusinessLayout){
                ItemClass = CBusinessProcess;
            }
            if(isInTechnicalFromConnectorLayout || isInTechnicalToConnectorLayout){
                ItemClass = CTechnicalProcess;
            }
        }
        const hasBeforeItem = hasBeforeLine;
        let {createIconStyles, afterItemLineStyles, beforeItemLineStyles, panelItemStyles} = ItemClass.getCreateElementPanelStyles(x, y, {isTypeCreateOperator, hasBeforeItem});
        const connector = connection.getConnectorByType(connectorType);
        const nameSource = connector.invoker.operations.map(operation => {
            return {label: operation.name, value: operation.name};
        });
        const isAddDisabled = name === '' || name === null;
        return(
            <React.Fragment>
                {hasBeforeLine && <Line style={beforeItemLineStyles}/>}
                <div className={styles.create_element_panel_for_item} style={panelItemStyles}>
                    <Select
                        id={'new_request_name'}
                        name={'new_request_name'}
                        value={name}
                        onChange={(a) => this.changeName(a)}
                        onKeyDown={(a) => this.onKeyDown(a)}
                        options={nameSource}
                        closeOnSelect={false}
                        placeholder={'Name'}
                        maxMenuHeight={200}
                        minMenuHeight={50}
                        label={'Name'}
                        className={styles.input_label}
                        required={true}
                    />
                    <Input id={'new_request_label'} theme={{input: styles.input_label}} onKeyDown={(a) => this.onKeyDown(a)} onChange={(a) => this.changeLabel(a)} value={label} label={'Label'}/>
                </div>
                <Line style={afterItemLineStyles}/>
                <CreateIcon create={(a) => this.create(a)} style={createIconStyles} isDisabled={isAddDisabled}/>
            </React.Fragment>
        );
    }
}

CreateProcess.defaulProps = {
    hasBeforeLine: false,
};

export default CreateProcess;
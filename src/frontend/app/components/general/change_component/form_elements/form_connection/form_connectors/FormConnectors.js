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
import PropTypes from 'prop-types';
import Input from '@basic_components/inputs/Input';
import styles from '@themes/default/general/change_component.scss';
import {FormElement} from "@decorators/FormElement";
import {Row, Col} from "react-grid-system";
import {ArrowRight} from '@basic_components/Arrows';

import {
    CONNECTOR_FROM,
    CONNECTOR_TO,
} from "@classes/components/content/connection/CConnectorItem";
import FormOperations from "../../form_invoker/FormOperations";
import InvokerButton from "./InvokerButton";
import ToolboxThemeInput from "../../../../../../hocs/ToolboxThemeInput";
import Select from "@basic_components/inputs/Select";


/**
 * Component for Form Connectors
 */
@FormElement()
class FormConnectors extends Component{

    constructor(props){
        super(props);
        this.state = {
            focused: false,
            isFromInvokerOpened: false,
            isToInvokerOpened: false,
            fromWillDisappear: false,
            toWillDisappear: false,
        };
    }

    toggleFromInvoker(){
        if(!this.state.isFromInvokerOpened === false){
            this.setState({fromWillDisappear: true});
            setTimeout(() => this.setState({
                isFromInvokerOpened: false,
                fromWillDisappear: false
            }), 500);
        } else{
            this.setState({
                isFromInvokerOpened: true,
            });
        }
    }

    toggleToInvoker(){
        if(!this.state.isToInvokerOpened === false){
            this.setState({toWillDisappear: true});
            setTimeout(() => this.setState({
                isToInvokerOpened: false,
                toWillDisappear: false
            }), 500);
        } else{
            this.setState({
                isToInvokerOpened: true,
            });
        }
    }

    /**
     * to handle change of the connectors
     */
    handleChange(value, connectorType){
        let {entity, updateEntity, data} = this.props;
        let {connectors, callback} = data;
        let connector = connectors ? connectors.find(c => c.id === value.value) : null;
        if(connector) {
            let invoker = connector.invoker;
            switch (connectorType) {
                case 'fromConnector':
                    entity.fromConnector.id = value.value;
                    entity.fromConnector.title = value.label;
                    entity.fromConnector.invoker = invoker;
                    entity.fromConnector.setConnectorType(CONNECTOR_FROM);
                    break;
                case 'toConnector':
                    entity.toConnector.id = value.value;
                    entity.toConnector.title = value.label;
                    entity.toConnector.invoker = invoker;
                    entity.toConnector.setConnectorType(CONNECTOR_TO);
                    break;
            }
            entity.resetToEmptyTemplate();
            updateEntity(entity);
            if(typeof callback === 'function'){
                callback(value, connectorType);
            }
        }
    }

    addMethod(connectorType, methodType, operation){
        const {entity, updateEntity} = this.props;
        let item = {};
        let connector = null;
        switch(connectorType) {
            case CONNECTOR_FROM:
                connector = entity.fromConnector;
                break;
            case CONNECTOR_TO:
                connector = entity.toConnector;
                break;
        }
        if(operation !== null && connector !== null) {
            item.name = operation.name;
            item.request = operation.request.getObject({bodyOnlyConvert: true});
            item.response = operation.response.getObject({bodyOnlyConvert: true});
            switch (connector.getConnectorType()) {
                case CONNECTOR_FROM:
                    entity.addFromConnectorMethod(item, methodType);
                    break;
                case CONNECTOR_TO:
                    entity.addToConnectorMethod(item, methodType);
                    break;
            }
            updateEntity(entity);
        }
    }

    renderFromInvoker(){
        const {hasAddMethod, connectors} = this.props.data;
        const {isFromInvokerOpened, fromWillDisappear} = this.state;
        if(!isFromInvokerOpened){
            return null;
        }
        const {entity} = this.props;
        let invoker = entity.fromConnector.invoker;
        return(
            <div className={`${styles.form_connector_from_invoker} ${fromWillDisappear ? styles.form_connector_from_invoker_disappear : styles.form_connector_from_invoker_appear}`}>
                <FormOperations entity={invoker} connector={entity.fromConnector} data={{readOnly: true, visible: true, canAddMethods: false, connectors,}} forConnection={true} addMethod={hasAddMethod === true ? ::this.addMethod : null}/>
            </div>
        );
    }

    renderToInvoker(){
        const {hasAddMethod, connectors} = this.props.data;
        const {isToInvokerOpened, toWillDisappear} = this.state;
        if(!isToInvokerOpened){
            return null;
        }
        const {entity} = this.props;
        let invoker = entity.toConnector.invoker;
        return(
            <div className={`${styles.form_connector_to_invoker} ${toWillDisappear ? styles.form_connector_to_invoker_disappear : styles.form_connector_to_invoker_appear}`}>
                <FormOperations entity={invoker} connector={entity.toConnector} data={{readOnly: true, visible: true, canAddMethods: false, connectors,}} forConnection={true} addMethod={hasAddMethod === true ? ::this.addMethod : null}/>
            </div>
        );
    }

    renderReadonlyConnectors(){
        const {isFromInvokerOpened, isToInvokerOpened} = this.state;
        const {entity} = this.props;
        let fromConnectorValue = entity.fromConnector.title;
        let toConnectorValue = entity.toConnector.title;
        return(
            <Row>
                <Col md={5} className={`${styles.form_select_connector}`}>
                    <Input
                        type={'text'}
                        value={fromConnectorValue}
                        readOnly
                        tabIndex={-1}
                        theme={{input: styles.form_connector_input}}
                    />
                    <InvokerButton onClick={::this.toggleFromInvoker} tooltip={fromConnectorValue} isOpened={isFromInvokerOpened}/>
                    {::this.renderFromInvoker()}
                </Col>
                <Col md={2} style={{textAlign: 'center'}}>
                    <ArrowRight className={styles.input_direction_arrow_readonly}/>
                </Col>
                <Col md={5} className={`${styles.form_select_connector}`}>
                    <Input
                        type={'text'}
                        value={toConnectorValue}
                        readOnly
                        tabIndex={-1}
                        theme={{input: styles.form_connector_input}}
                    />
                    <InvokerButton onClick={::this.toggleToInvoker} tooltip={toConnectorValue} position={'right'} isOpened={isToInvokerOpened}/>
                    {::this.renderToInvoker()}
                </Col>
            </Row>
        );

    }

    renderConnectors(){
        const {source, placeholders, error} = this.props.data;
        const {entity} = this.props;
        let fromConnectorValue = entity.fromConnector ? source && source.find(s => s.value === entity.fromConnector.id) : {label: 'Please, select connector', value: 0};
        let toConnectorValue = entity.toConnector ? source && source.find(s => s.value === entity.toConnector.id) : {label: 'Please, select connector', value: 0};
        const fromPlaceholder = placeholders && placeholders.length > 0 ? placeholders[0] : '';
        const toPlaceholder = placeholders && placeholders.length > 1 ? placeholders[1] : '';
        return(
            <Row>
                <Col md={5} className={`${styles.form_select_connector}`}>
                    <Select
                        id={'input_fromConnector'}
                        error={error}
                        value={fromConnectorValue}
                        onChange={(e, connector) => ::this.handleChange(e, 'fromConnector')}
                        options={source}
                        closeOnSelect={false}
                        placeholder={fromPlaceholder}
                        maxMenuHeight={200}
                        minMenuHeight={50}
                    />
                </Col>
                <Col md={2} style={{textAlign: 'center'}}>
                    <ArrowRight className={styles.input_direction_arrow_readonly}/>
                </Col>
                <Col md={5} className={`${styles.form_select_connector}`}>
                    <Select
                        id={'input_toConnector'}
                        error={error}
                        value={toConnectorValue}
                        onChange={(e, connector) => ::this.handleChange(e, 'toConnector')}
                        options={source}
                        closeOnSelect={false}
                        placeholder={toPlaceholder}
                        maxMenuHeight={200}
                        minMenuHeight={50}
                    />
                </Col>
            </Row>
        );
    }

    render(){
        let {tourStep, readOnly} = this.props.data;
        if(!tourStep){
            tourStep = '';
        }
        return (
            <ToolboxThemeInput
                label={'Connectors'}
                style={readOnly ? {margin: '0 65px'} : {}}
                icon={'share'}
                tourStep={tourStep}
                required={true}
                hasFocusStyle={false}
                inputElementClassName={styles.form_connector_input_element}
            >
                {
                    typeof readOnly === 'boolean' && readOnly
                    ?
                        this.renderReadonlyConnectors()
                    :
                        this.renderConnectors()
                }
            </ToolboxThemeInput>
        );
    }
}

FormConnectors.propTypes = {
    entity: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
};


export default FormConnectors;
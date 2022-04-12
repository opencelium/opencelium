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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
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
import InputSelect from "@atom/input/select/InputSelect";
import {isString} from "@utils/app";


const HAS_API_DOCS = false;

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

    /**
     * to render api doc of from invoker
     */
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
                <FormOperations entity={invoker} connector={entity.fromConnector} data={{readOnly: true, visible: true, canAddMethods: false, connectors,}} forConnection={true} addMethod={hasAddMethod === true ? (a, b, c) => this.addMethod(a, b, c) : null}/>
            </div>
        );
    }

    /**
     * to render api doc of to invoker
     */
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
                <FormOperations entity={invoker} connector={entity.toConnector} data={{readOnly: true, visible: true, canAddMethods: false, connectors,}} forConnection={true} addMethod={hasAddMethod === true ? (a, b, c) => this.addMethod(a, b, c) : null}/>
            </div>
        );
    }

    renderReadonlyConnectors(){
        const {isFromInvokerOpened, isToInvokerOpened} = this.state;
        const {entity, data} = this.props;
        const hasApiDocs = data.hasOwnProperty('hasApiDocs') ? data.hasApiDocs && data.visible : false;
        let fromConnectorValue = entity.fromConnector.title || data.connectors.find(c => c.connectorId === entity.fromConnector.id);
        if(fromConnectorValue && !isString(fromConnectorValue) && fromConnectorValue.hasOwnProperty('title')){
            fromConnectorValue = fromConnectorValue.title;
        }
        let toConnectorValue = entity.toConnector.title || data.connectors.find(c => c.connectorId === entity.toConnector.id);
        if(toConnectorValue && !isString(toConnectorValue) && toConnectorValue.hasOwnProperty('title')){
            toConnectorValue = toConnectorValue.title;
        }
        return(
            <Row>
                <Col md={5} className={`${styles.form_select_connector}`} style={{textAlign: 'right'}}>
                    <InputSelect
                        icon={'share'}
                        label={'Connectors'}
                        value={{label: fromConnectorValue, value: fromConnectorValue}}
                        readOnly
                        options={data.source}
                    />
                    {hasApiDocs && HAS_API_DOCS && <InvokerButton onClick={() => this.toggleFromInvoker()} tooltip={fromConnectorValue} isOpened={isFromInvokerOpened}/>}
                    {this.renderFromInvoker()}
                </Col>
                <Col md={2} style={{textAlign: 'center', alignSelf: 'center'}}>
                    <ArrowRight className={styles.input_direction_arrow_readonly} style={{marginTop: '20px'}}/>
                </Col>
                <Col md={5} className={`${styles.form_select_connector}`}>
                    <InputSelect
                        label={' '}
                        value={{label: toConnectorValue, value: toConnectorValue}}
                        readOnly
                        options={data.source}
                    />
                    {hasApiDocs && HAS_API_DOCS && <InvokerButton onClick={() => this.toggleToInvoker()} tooltip={toConnectorValue} position={'right'} isOpened={isToInvokerOpened}/>}
                    {this.renderToInvoker()}
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
                    <InputSelect
                        id={'input_fromConnector'}
                        icon={'share'}
                        label={'Connectors'}
                        error={error.fromConnector}
                        value={fromConnectorValue}
                        onChange={(e, connector) => this.handleChange(e, 'fromConnector')}
                        options={source}
                        placeholder={fromPlaceholder}
                    />{/*
                    <Select
                        id={'input_fromConnector'}
                        error={error.fromConnector}
                        value={fromConnectorValue}
                        onChange={(e, connector) => this.handleChange(e, 'fromConnector')}
                        options={source}
                        closeOnSelect={false}
                        placeholder={fromPlaceholder}
                        maxMenuHeight={200}
                        minMenuHeight={50}
                    />*/}
                </Col>
                <Col md={2} style={{textAlign: 'center'}}>
                    <ArrowRight className={styles.input_direction_arrow_readonly} style={{marginTop: '20px'}}/>
                </Col>
                <Col md={5} className={`${styles.form_select_connector}`}>
                    <InputSelect
                        id={'input_toConnector'}
                        label={' '}
                        error={error.toConnector}
                        value={toConnectorValue}
                        onChange={(e, connector) => this.handleChange(e, 'toConnector')}
                        options={source}
                        placeholder={toPlaceholder}
                    />
                </Col>
            </Row>
        );
    }

    render(){
        let {readOnly} = this.props.data;
        return (
            <div>
                {
                    typeof readOnly === 'boolean' && readOnly
                    ?
                        this.renderReadonlyConnectors()
                    :
                        this.renderConnectors()
                }
            </div>
        );
    }
}

FormConnectors.propTypes = {
    entity: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
};


export default FormConnectors;
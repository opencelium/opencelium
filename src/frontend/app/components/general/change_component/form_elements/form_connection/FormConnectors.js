/*
 * Copyright (C) <2020>  <becon GmbH>
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
import Select from 'react-select';
import Input from '../../../basic_components/inputs/Input';

import theme from "react-toolbox/lib/input/theme.css";
import styles from '../../../../../themes/default/general/change_component.scss';
import {FormElement} from "../../../../../decorators/FormElement";
import {Row, Col} from "react-grid-system";
import {ArrowRight} from '../../../basic_components/Arrows';

import {CONNECTOR_FROM, CONNECTOR_TO} from "../../../../../classes/components/content/connection/CConnectorItem";
import FormOperations from "../form_invoker/FormOperations";
import TooltipFontIcon from "../../../basic_components/tooltips/TooltipFontIcon";


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
        let {connectors} = data;
        let connector = connectors.find(c => c.id === value.value);
        let invoker = connector.invoker;
        switch(connectorType){
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
    }

    renderFromInvoker(){
        const {isFromInvokerOpened, fromWillDisappear} = this.state;
        if(!isFromInvokerOpened){
            return null;
        }
        const {entity} = this.props;
        let invoker = entity.fromConnector.invoker;
        return(
            <div className={`${styles.form_connector_from_invoker} ${fromWillDisappear ? styles.form_connector_from_invoker_disappear : styles.form_connector_from_invoker_appear}`}>
                <FormOperations entity={invoker} data={{readOnly: true, visible: true}} forConnection={true}/>
            </div>
        );
    }

    renderToInvoker(){
        const {isToInvokerOpened, toWillDisappear} = this.state;
        if(!isToInvokerOpened){
            return null;
        }
        const {entity} = this.props;
        let invoker = entity.toConnector.invoker;
        return(
            <div className={`${styles.form_connector_to_invoker} ${toWillDisappear ? styles.form_connector_to_invoker_disappear : styles.form_connector_to_invoker_appear}`}>
                <FormOperations entity={invoker} data={{readOnly: true, visible: true}} forConnection={true}/>
            </div>
        );
    }

    renderReadonlyConnectors(){
        const {isFromInvokerOpened, isToInvokerOpened} = this.state;
        const {source, placeholders} = this.props.data;
        const {entity} = this.props;
        let fromConnectorValue = entity.fromConnector.title;
        let toConnectorValue = entity.toConnector.title;
        return(
            <Row>
                <Col md={5} className={`${styles.form_select_connector}`}>
                    <Input
                        label={placeholders[0]}
                        type={'text'}
                        value={fromConnectorValue}
                        readOnly
                        required
                    />
                    <TooltipFontIcon tooltipPosition={'right'} tooltip={`${fromConnectorValue} Invoker`} className={styles.form_connector_arrow_from} value={isFromInvokerOpened ? 'arrow_left' : 'arrow_right'} onClick={::this.toggleFromInvoker}/>
                    {::this.renderFromInvoker()}
                </Col>
                <Col md={2} style={{textAlign: 'center'}}>
                    <ArrowRight className={styles.input_direction_arrow_readonly}/>
                </Col>
                <Col md={5} className={`${styles.form_select_connector}`}>
                    <Input
                        label={placeholders[1]}
                        type={'text'}
                        value={toConnectorValue}
                        readOnly
                        required
                    />
                    <TooltipFontIcon tooltipPosition={'left'} tooltip={`${toConnectorValue} Invoker`} className={styles.form_connector_arrow_to} value={isToInvokerOpened ? 'arrow_right' : 'arrow_left'} onClick={::this.toggleToInvoker}/>
                    {::this.renderToInvoker()}
                </Col>
            </Row>
        );

    }

    renderConnectors(){
        const {source, placeholders} = this.props.data;
        const {entity} = this.props;
        let fromConnectorValue = entity.fromConnector ? source.find(s => s.value === entity.fromConnector.id) : {label: 'Please, select connector', value: 0};
        let toConnectorValue = entity.toConnector ? source.find(s => s.value === entity.toConnector.id) : {label: 'Please, select connector', value: 0};
        return(
            <Row>
                <Col md={5} className={`${styles.form_select_connector}`}>
                    <div className={`${theme.inputElement} ${theme.filled} ${styles.input_connector_placeholder}`}>{placeholders[0]}</div>
                    <Select
                        id={'from_connector'}
                        value={fromConnectorValue}
                        onChange={(e, connector) => ::this.handleChange(e, 'fromConnector')}
                        options={source}
                        closeOnSelect={false}
                        placeholder={'Connector'}
                        maxMenuHeight={200}
                        minMenuHeight={50}
                    />
                </Col>
                <Col md={2} style={{textAlign: 'center', lineHeight: '84px'}}>
                    <ArrowRight style={{marginTop: '32px'}} className={styles.input_direction_arrow_readonly}/>
                </Col>
                <Col md={5} className={`${styles.form_select_connector}`}>
                    <div className={`${theme.inputElement} ${theme.filled} ${styles.input_connector_placeholder}`}>{placeholders[1]}</div>
                    <Select
                        id={'to_connector'}
                        value={toConnectorValue}
                        onChange={(e, connector) => ::this.handleChange(e, 'toConnector')}
                        options={source}
                        closeOnSelect={false}
                        placeholder={'Connector'}
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
            <div className={`${theme.withIcon} ${theme.input} ${tourStep}`} style={{margin: '0 65px'}}>
                <div className={`${theme.inputElement} ${theme.filled} ${styles.multiselect_label}`}/>
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
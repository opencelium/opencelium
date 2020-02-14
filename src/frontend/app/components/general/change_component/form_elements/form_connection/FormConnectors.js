/*
 * Copyright (C) <2019>  <becon GmbH>
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

import {isArray} from '../../../../../utils/app';
import {CONNECTOR_FROM, CONNECTOR_TO} from "../../../../../classes/components/content/connection/CConnectorItem";
import FormMethods from "./form_methods/FormMethods";


/**
 * Component for Form Connectors
 */
@FormElement()
class FormConnectors extends Component{

    constructor(props){
        super(props);
        this.state = {
            focused: false,
        };
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

    renderReadonlyConnectors(){
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
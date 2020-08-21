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
import styles from '@themes/default/general/form_methods.scss';
import {consoleLog, isString} from "@utils/app";
import CMethodItem from "@classes/components/content/connection/method/CMethodItem";

import theme from "react-toolbox/lib/input/theme.css";
import {
    STATEMENT_REQUEST,
    STATEMENT_RESPONSE
} from "@classes/components/content/connection/operator/CStatement";
import {
    RESPONSE_FAIL,
    RESPONSE_SUCCESS
} from "@classes/components/content/invoker/response/CResponse";
import {CONNECTOR_TO} from "@classes/components/content/connection/CConnectorItem";
import CBindingItem from "@classes/components/content/connection/field_binding/CBindingItem";
import CardText from "@basic_components/card/CardText";
import Endpoint from "./Endpoint";
import CConnection from "@classes/components/content/connection/CConnection";
import CConnectorItem from "@classes/components/content/connection/CConnectorItem";
import {convertFieldNameForBackend} from "../help";
import JsonBody from "./JsonBody";
import XmlBody from "@change_component/form_elements/form_connection/form_methods/method/XmlBody";
import {BODY_FORMAT} from "@classes/components/content/invoker/CBody";
import CXml from "@classes/components/content/xml/CXml";
import CXmlEditor from "@classes/components/general/basic_components/xml_editor/CXmlEditor";
import {CJsonEditor} from "@classes/components/general/basic_components/json_editor/CJsonEditor";


class MethodRequest extends Component{

    constructor(props){
        super(props);
    }

    componentDidMount(){
        let that = this;
        const {id} = that.props;
        setTimeout(function(){
            const elem = document.getElementById(id);
            if(elem) {
                elem.classList.remove(styles.item_card_text);
                elem.classList.add(styles.item_card_text_show);
                setTimeout(() => {
                    elem.style.overflow = 'visible';
                }, 500);
            }
        }, 200);
    }

    renderBody(){
        const {id, readOnly, method, connector, connection, updateEntity, isDraft} = this.props;
        switch(method.bodyFormat){
            case BODY_FORMAT.JSON:
                return (
                    <JsonBody
                        id={id}
                        isDraft={isDraft}
                        readOnly={readOnly}
                        method={method}
                        connection={connection}
                        connector={connector}
                        updateEntity={updateEntity}
                    />
                );
            case BODY_FORMAT.XML:
                return (
                    <XmlBody
                        id={id}
                        isDraft={isDraft}
                        readOnly={readOnly}
                        method={method}
                        connection={connection}
                        connector={connector}
                        updateEntity={updateEntity}
                    />
                );
        }
        return null;
    }

    render(){
        const {id, readOnly, method, connector, connection, updateEntity} = this.props;
        let bodyHasError = false;
        if(method.error.hasError){
            if(method.error.location === 'body'){
                bodyHasError = true;
            }
        }
        return (
            <div id={id} className={styles.item_card_text}>
                <CardText>
                    <div className={styles.method_param}>
                        <Endpoint
                            method={method}
                            connector={connector}
                            connection={connection}
                            readOnly={readOnly}
                            updateEntity={updateEntity}
                        />
                        <label className={`${theme.label} ${styles.body_label}`} style={bodyHasError ? {color: 'red'} : {}}>{'Body'}</label>
                        {this.renderBody()}
                    </div>
                </CardText>
            </div>
        );
    }
}

MethodRequest.propTypes = {
    id: PropTypes.string.isRequired,
    method: PropTypes.instanceOf(CMethodItem).isRequired,
    updateEntity: PropTypes.func.isRequired,
    connection: PropTypes.instanceOf(CConnection).isRequired,
    connector: PropTypes.instanceOf(CConnectorItem).isRequired,
    readOnly: PropTypes.bool,
};

MethodRequest.defaultProps = {
    readOnly: false,
    isDraft: false,
};

export default MethodRequest;
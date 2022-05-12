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

import ReactDOM from 'react-dom';
import React from 'react';
import {Col, Row} from "react-grid-system";
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import TooltipFontIcon from "@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon";
import Dialog from "@entity/connection/components/components/general/basic_components/Dialog";
import {BODY_FORMAT} from "@entity/connection/components/classes/components/content/invoker/CBody";
import JsonBody from "@change_component/form_elements/form_connection/form_methods/method/JsonBody";
import XmlBody from "@change_component/form_elements/form_connection/form_methods/method/XmlBody";
import Enhancement from "@change_component/form_elements/form_connection/form_methods/mapping/enhancement/Enhancement";
import {CONNECTOR_FROM, CONNECTOR_TO} from "@entity/connection/components/classes/components/content/connection/CConnectorItem";
import {isNumber, subArrayToString} from "@application/utils/utils";
import CEnhancement from "@entity/connection/components/classes/components/content/connection/field_binding/CEnhancement";
import Button from "@entity/connection/components/components/general/basic_components/buttons/Button";
import {markFieldNameAsArray} from "@change_component//form_elements/form_connection/form_methods/help";
import GraphQLBody from "@change_component/form_elements/form_connection/form_methods/method/GraphQLBody";

class Body extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            isBodyVisible: false,
            currentFieldName: '',
            currentEnhancement: null,
        }
    }

    toggleBodyVisible(){
        const {connection, updateConnection, setCurrentInfo, nameOfCurrentInfo} = this.props;
        if(!this.state.isBodyVisible) {
            connection.currentEnhancemnet = null;
        }
        if(setCurrentInfo) setCurrentInfo(nameOfCurrentInfo);
        updateConnection(connection);
        this.setState({
            isBodyVisible: !this.state.isBodyVisible,
            currentEnhancement: null,
            currentFieldName: '',
        });
    }

    getCurrentBindingItem(fieldName){
        const {connection, method} = this.props;
        return connection.fieldBinding.find(item => {
            return item.to.findIndex(elem => {
                let name = elem.field.replace('[]', '');
                return elem.color === method.color && name === fieldName;
            }) !== -1;
        });
    }

    setCurrentEnhancementClickingOnPointer(e, value){
        const {connection, connector} = this.props;
        if(connector.getConnectorType() === CONNECTOR_FROM){
            return;
        }
        let fieldName = '';
        if(value.namespace.length > 1){
            for(let i = 1; i < value.namespace.length; i++){
                if((i + 1) < value.namespace.length && isNumber(value.namespace[i + 1])){
                    fieldName += markFieldNameAsArray(value.namespace[i], value.namespace[i + 1]);
                    i++;
                } else{
                    fieldName += value.namespace[i];
                }
                fieldName += '.';
            }
        }
        fieldName += value.variable.name;
        let bindingItem = this.getCurrentBindingItem(fieldName);
        if(bindingItem){
            bindingItem = bindingItem.to[0];
            connection.setCurrentFieldBindingTo(bindingItem);
        }
        this.setCurrentEnhancement(connection.getEnhancementByTo());
        this.setState({
            currentFieldName: fieldName,
        })
    }

    setCurrentEnhancement(currentEnhancement){
        const {connection} = this.props;
        if(currentEnhancement !== null) {
            connection.updateEnhancement(currentEnhancement);
        }
        this.setState({currentEnhancement: currentEnhancement instanceof CEnhancement ? currentEnhancement.getObject() : currentEnhancement});
    }

    updateEntity(entity = null){
        const {currentFieldName} = this.state;
        const {connection, updateConnection} = this.props;
        let currentEntity = entity === null ? connection : entity;
        updateConnection(currentEntity);
        if(currentFieldName !== '') {
            let bindingItem = this.getCurrentBindingItem(currentFieldName);
            if (bindingItem) {
                bindingItem = bindingItem.to[0];
                currentEntity.setCurrentFieldBindingTo(bindingItem);
            }
            this.setCurrentEnhancement(currentEntity.getEnhancementByTo());
        }
    }

    renderBody(){
        const {readOnly, method, connection, isDraft, source, connector} = this.props;
        if(method.isGraphQLData()){
            return (
                <GraphQLBody
                    id={'description_body'}
                    isDraft={isDraft}
                    readOnly={readOnly}
                    method={connector.getMethodByIndex(method.index)}
                    connection={connection}
                    connector={connector}
                    updateEntity={(a) => this.updateEntity(a)}
                    noPlaceholder={true}
                    source={source}
                    openEnhancement={(a, b) => this.setCurrentEnhancementClickingOnPointer(a, b)}
                />
            );
        }
        switch(method.bodyFormat){
            case BODY_FORMAT.JSON:
                return (
                    <JsonBody
                        id={'description_body'}
                        isDraft={isDraft}
                        readOnly={readOnly}
                        method={connector.getMethodByIndex(method.index)}
                        connection={connection}
                        connector={connector}
                        updateEntity={(a) => this.updateEntity(a)}
                        noPlaceholder={true}
                        source={source}
                        openEnhancement={(a, b) => this.setCurrentEnhancementClickingOnPointer(a, b)}
                    />
                );
            case BODY_FORMAT.XML:
                return (
                    <XmlBody
                        id={'description_body'}
                        requestBodyClassName={styles.svg_description_xml_body}
                        isDraft={isDraft}
                        readOnly={readOnly}
                        method={connector.getMethodByIndex(method.index)}
                        connection={connection}
                        connector={connector}
                        updateEntity={(a) => this.updateEntity(a)}
                        noPlaceholder={true}
                        source={source}
                        openEnhancement={(a, b) => this.setCurrentEnhancementClickingOnPointer(a, b)}
                    />
                );
        }
    }

    renderEnhancement(){
        const {currentEnhancement} = this.state;
        const {readOnly} = this.props;
        if(!currentEnhancement){
            return (
                <div className={styles.body_reference_not_selected_message}>
                    Please, click on the reference
                </div>
            );
        }
        return(
            <div className={styles.data}>
                <Enhancement readOnly={readOnly} enhancement={{...currentEnhancement}} setEnhancement={(a) => this.setCurrentEnhancement(a)}/>
            </div>
        );
    }

    renderInfo(){
        const {bodyTitle, connector, isExtended, readOnly} = this.props;
        const hasEnhancement = connector.getConnectorType() === CONNECTOR_TO;
        return(
            <React.Fragment>
                <div className={hasEnhancement ? styles.body_data_with_enhancement : styles.body_data}>
                    <div><b>{bodyTitle}</b></div>
                    {this.renderBody()}
                </div>
                {hasEnhancement &&
                    <div className={styles.body_enhancement}>
                        <div><b>{'Enhancement'}</b></div>
                        {this.renderEnhancement()}
                    </div>
                }
                {isExtended && !readOnly &&
                    <Button
                        className={styles.extended_details_button_save_body}
                        title={'Save'}
                        onClick={(a) => this.toggleBodyVisible(a)}
                    />
                }
            </React.Fragment>
        );
    }

    render(){
        const {isBodyVisible} = this.state;
        const {connector, isExtended, isCurrentInfo, method} = this.props;
        const isGraphQLData = method.isGraphQLData();
        const hasEnhancement = connector.getConnectorType() === CONNECTOR_TO && !isGraphQLData;
        return(
            <React.Fragment>
                <Col xs={4} className={`${styles.col} ${styles.entry_padding}`}>{`Body`}</Col>
                <Col xs={8} className={`${styles.col}`}>
                    <TooltipFontIcon onClick={(a) => this.toggleBodyVisible(a)} size={14} value={<span className={styles.more_details}>{`...`}</span>} tooltip={'Body'}/>
                </Col>
                {isExtended && isCurrentInfo &&
                    ReactDOM.createPortal(
                        this.renderInfo(), document.getElementById('extended_details_information')
                    )
                }
                <Dialog
                    actions={[{label: 'Ok', onClick: (a) => this.toggleBodyVisible(a), id: 'header_ok'}]}
                    active={isBodyVisible && !isExtended}
                    toggle={(a) => this.toggleBodyVisible(a)}
                    title={'Body'}
                    theme={{dialog: isGraphQLData ? styles.body_dialog_graphql : hasEnhancement ? styles.body_dialog_with_enhancement : styles.body_dialog, content: styles.body_content}}
                >
                    {this.renderInfo()}
                </Dialog>
            </React.Fragment>
        );
    }
}

Body.defaultProps = {
    isDraft: false,
};

export default Body;
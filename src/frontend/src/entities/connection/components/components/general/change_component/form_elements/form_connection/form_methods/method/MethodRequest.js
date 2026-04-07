/*
 *  Copyright (C) <2023>  <becon GmbH>
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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import styles from '@entity/connection/components/themes/default/general/form_methods.scss';
import CMethodItem from "@entity/connection/components/classes/components/content/connection/method/CMethodItem";
import CardText from "@entity/connection/components/components/general/basic_components/card/CardText";
import Endpoint from "./Endpoint";
import CConnection from "@entity/connection/components/classes/components/content/connection/CConnection";
import CConnectorItem from "@entity/connection/components/classes/components/content/connection/CConnectorItem";
import JsonBody from "./JsonBody";
import XmlBody from "@change_component/form_elements/form_connection/form_methods/method/XmlBody";
import {BODY_FORMAT} from "@entity/connection/components/classes/components/content/invoker/CBody";
import ToolboxThemeInput from "../../../../../../../hocs/ToolboxThemeInput";
import GraphQLBody from "@change_component/form_elements/form_connection/form_methods/method/GraphQLBody";
import Dialog from "@entity/connection/components/components/general/basic_components/Dialog";
import TooltipFontIcon from "@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon";

class MethodRequest extends Component{
    constructor(props){
        super(props);

        this.state = {
            showDialog: false,
        };

        this.openTimeout = null;
        this.overflowTimeout = null;

        this.handleToggleDialog = this.toggleDialog.bind(this);
        this.handleUpdateEntity = this.updateEntity.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState){
        return (
            nextProps.id !== this.props.id ||
            nextProps.readOnly !== this.props.readOnly ||
            nextProps.method !== this.props.method ||
            nextProps.connector !== this.props.connector ||
            nextProps.connection !== this.props.connection ||
            nextProps.updateEntity !== this.props.updateEntity ||
            nextProps.isDraft !== this.props.isDraft ||
            nextState.showDialog !== this.state.showDialog
        );
    }

    componentDidMount(){
        const {id} = this.props;

        this.openTimeout = setTimeout(() => {
            const elem = document.getElementById(id);
            if(elem) {
                elem.classList.remove(styles.item_card_text);
                elem.classList.add(styles.item_card_text_show);

                this.overflowTimeout = setTimeout(() => {
                    elem.style.overflow = 'visible';
                }, 500);
            }
        }, 200);
    }

    componentWillUnmount() {
        if (this.openTimeout) {
            clearTimeout(this.openTimeout);
            this.openTimeout = null;
        }

        if (this.overflowTimeout) {
            clearTimeout(this.overflowTimeout);
            this.overflowTimeout = null;
        }
    }

    toggleDialog(){
        this.setState((prevState) => ({
            showDialog: !prevState.showDialog,
        }));
    }

    updateEntity(entity = null){
        const {updateEntity} = this.props;
        if (entity === null) {
            updateEntity();
        } else {
            updateEntity(entity);
        }
    }

    renderBody(){
        const {id, readOnly, method, connector, connection, isDraft} = this.props;

        if(method.isGraphQLData()) {
            return (
                <GraphQLBody
                    id={id}
                    isDraft={isDraft}
                    readOnly={readOnly}
                    method={method}
                    connection={connection}
                    connector={connector}
                    updateEntity={this.handleUpdateEntity}
                />
            );
        }

        switch(method.bodyFormat){
            case BODY_FORMAT.X_WWW_URL_ENCODED:
            case BODY_FORMAT.JSON:
                return (
                    <JsonBody
                        id={id}
                        isDraft={isDraft}
                        readOnly={readOnly}
                        method={method}
                        connection={connection}
                        connector={connector}
                        updateEntity={this.handleUpdateEntity}
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
                        updateEntity={this.handleUpdateEntity}
                    />
                );

            default:
                return null;
        }
    }

    render(){
        const {showDialog} = this.state;
        const {id, readOnly, method, connector, connection} = this.props;

        let bodyHasError = false;
        if(method.error.hasError){
            if(method.error.location === 'body'){
                bodyHasError = true;
            }
        }

        const isGraphQLData = method.isGraphQLData();

        return (
            <div id={id} className={styles.item_card_text}>
                <CardText>
                    <div className={styles.method_param}>
                        <Endpoint
                            method={method}
                            connector={connector}
                            connection={connection}
                            readOnly={readOnly}
                            updateEntity={this.handleUpdateEntity}
                        />
                        <ToolboxThemeInput
                            className={styles.method_body_label}
                            label={
                                <span
                                    className={styles.body_label}
                                    style={bodyHasError ? {color: 'red'} : {}}
                                >
                                    {'Body'}
                                </span>
                            }
                        >
                            {isGraphQLData ? (
                                <React.Fragment>
                                    <Dialog
                                        actions={[{
                                            label: 'Ok',
                                            onClick: this.handleToggleDialog,
                                            id: 'header_ok'
                                        }]}
                                        active={showDialog}
                                        toggle={this.handleToggleDialog}
                                        title={'Body'}
                                        theme={{
                                            dialog: styles.body_dialog_graphql,
                                            content: styles.body_content
                                        }}
                                    >
                                        {this.renderBody()}
                                    </Dialog>
                                    <TooltipFontIcon
                                        onClick={this.handleToggleDialog}
                                        size={14}
                                        value={<span className={styles.more_details}>{`graphql`}</span>}
                                        tooltip={'Body'}
                                    />
                                </React.Fragment>
                            ) : (
                                this.renderBody()
                            )}
                        </ToolboxThemeInput>
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
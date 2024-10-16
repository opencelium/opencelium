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

import Confirmation from "../../../../../app/Confirmation";
import chroma from 'chroma-js';
import CConnection from "@entity/connection/components/classes/components/content/connection/CConnection";
import CConnectorItem, {
    CONNECTOR_FROM,
    CONNECTOR_TO
} from "@entity/connection/components/classes/components/content/connection/CConnectorItem";
import CMethodItem from "@entity/connection/components/classes/components/content/connection/method/CMethodItem";
import FontIcon from "@entity/connection/components/components/general/basic_components/FontIcon";
import CardTitle from "@entity/connection/components/components/general/basic_components/card/CardTitle";
import TooltipFontIcon from "@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon";
import {deepObjectsMerge, isEqualObjectParams} from "@application/utils/utils";
import _ from "lodash";


/**
 * MethodTitle Component
 */
class MethodTitle extends Component{

    constructor(props){
        super(props);

        let hasRefreshIcon = false;

        const newInvokerData = props.method.invoker._operations.find(o => o.name === props.method.name);
        if(newInvokerData){
            if(!isEqualObjectParams(newInvokerData.request.body.fields, props.method.request.body.fields)
                || !isEqualObjectParams(newInvokerData.response.success.body.fields, props.method.response.success.body.fields)
                || !isEqualObjectParams(newInvokerData.response.fail.body.fields, props.method.response.fail.body.fields)){
                hasRefreshIcon = true;
            }
        }
        this.state = {
            hasDeleteButton: false,
            showSettings: false,
            openSettings: false,
            showConfirm: false,
            onDeleteButtonOver: false,
            isRefreshingFromInvoker: false,
            hasRefreshIcon,
        };
    }

    /**
     * to show delete button
     */
    isOnDeleteButtonOver(){
        this.setState({onDeleteButtonOver: true});
    }

    /**
     * to hide delete button
     */
    isNotOnDeleteButtonOver(){
        this.setState({onDeleteButtonOver: false});
    }

    /**
     * to show delete button if has
     */
    showDeleteButton(){
        const {readOnly} = this.props;
        if(!readOnly) {
            this.setState({
                hasDeleteButton: true,
            });
        }
    }

    /**
     * to hide delete button if has not
     */
    hideDeleteButton(){
        this.setState({
            hasDeleteButton: false,
        });
    }

    /**
     * to show/hide confirmation to delete
     */
    toggleConfirm(){
        this.setState({showConfirm: !this.state.showConfirm});
    }

    /**
     * to refresh data from invoker
     */
    refreshInvoker(){
        const that = this;
        const {method, updateEntity} = this.props;
        let newInvokerData = method.invoker._operations.find(o => o.name === method.name);
        if(newInvokerData){
            let newRequestInvokerData = deepObjectsMerge(newInvokerData.request.body.fields, method.request.body.fields);
            let newResponseSuccessInvokerData = deepObjectsMerge(newInvokerData.response.success.body.fields, method.response.success.body.fields);
            let newResponseFailInvokerData = deepObjectsMerge(newInvokerData.response.fail.body.fields, method.response.fail.body.fields);
            method.setRequestBodyFields(newRequestInvokerData);
            method.setResponseSuccessBodyFields(newResponseSuccessInvokerData);
            method.setResponseFailBodyFields(newResponseFailInvokerData);
            method.setRequestBodyType(newInvokerData.request.body.type);
            method.setResponseSuccessBodyType(newInvokerData.response.success.body.type);
            method.setResponseFailBodyType(newInvokerData.response.fail.body.type);
            updateEntity();
            this.setState({
                isRefreshingFromInvoker: true,
            }, () => setTimeout(() => that.setState({isRefreshingFromInvoker: false, hasRefreshIcon: false,}), 600));
        }
    }

    /**
     * to delete method
     */
    removeMethod(){
        const {toggleDeleteMethod} = this.props;
        let that = this;
        that.toggleConfirm();
        setTimeout(
            () => {
                toggleDeleteMethod();
                setTimeout(() => {
                    const {connection, connector, method, updateEntity} = that.props;
                    let connectorType = connector.getConnectorType();
                    switch (connectorType) {
                        case CONNECTOR_FROM:
                            connection.removeFromConnectorMethod(method);
                            break;
                        case CONNECTOR_TO:
                            connection.removeToConnectorMethod(method);
                            break;
                    }
                    updateEntity();
                }, 300);
            }, 200);
    }

    /**
     * to set current item
     */
    setCurrentItem(){
        const {connector, method, updateEntity} = this.props;
        connector.setCurrentItem(method);
        updateEntity();
    }

    render(){
        const {connector, method, readOnly, showParams, toggleShowParams} = this.props;
        const {showConfirm, onDeleteButtonOver, hasDeleteButton, isRefreshingFromInvoker, hasRefreshIcon} = this.state;
        let methodStyles = {};
        let methodTitleStyles = {backgroundColor: method.color, borderRadius: '3px'};
        let isCurrentItem = connector.getCurrentItem().index === method.index;
        if(isCurrentItem){
            methodTitleStyles.borderBottomStyle = 'none';
            methodStyles.boxShadow = `0 0 0 0 rgba(0, 0, 0, .14), 0 2px 11px 2px ${chroma(method.color).darken(3)}, 0 1px 5px 0 rgba(0, 0, 0, .12)`;
        }
        let indexSplitter = method.index.split('_');
        let marginLeftTimes = indexSplitter.length;
        if(marginLeftTimes > 1) {
            methodStyles.marginLeft = (marginLeftTimes - 1) * 20 + 'px';
        }
        return (
            <div>
                <CardTitle
                    style={methodTitleStyles}
                    onMouseEnter={() => this.showDeleteButton()}
                    onMouseLeave={() => this.hideDeleteButton()}
                    onClick={() => this.setCurrentItem()}
                    theme={{cardTitle: styles.item_card_title}}
                >
                    <div style={{width: '100%', position: 'relative'}}>
                        <div style={{cursor: 'pointer', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap'}} onClick={toggleShowParams}>
                            <FontIcon value={showParams ? 'keyboard_arrow_down' : 'keyboard_arrow_right'} className={styles.item_title_arrow}/>
                            <span className={styles.item_title} title={method.name}>{method.name}</span>
                        </div>
                        {
                            !readOnly && (isCurrentItem || hasDeleteButton) ?
                                <div>
                                    {(hasRefreshIcon || isRefreshingFromInvoker) && <TooltipFontIcon
                                        size={isRefreshingFromInvoker ? 16 : 20}
                                        isButton={true}
                                        className={styles.item_refresh_button}
                                        value={isRefreshingFromInvoker ? 'loading' : 'refresh'}
                                        onClick={() => this.refreshInvoker()}
                                        tooltip={'Refresh'}
                                    />}
                                    <TooltipFontIcon
                                        size={20}
                                        isButton={true}
                                        className={styles.item_delete_button}
                                        value={onDeleteButtonOver ? 'delete_forever' : 'delete'}
                                        onMouseOver={() => this.isOnDeleteButtonOver()}
                                        onMouseLeave={() => this.isNotOnDeleteButtonOver()}
                                        onClick={() => this.toggleConfirm()}
                                        tooltip={'Delete'}
                                    />
                                </div>
                                :
                                null
                        }
                    </div>
                </CardTitle>
                <Confirmation
                    okClick={() => this.removeMethod()}
                    cancelClick={() => this.toggleConfirm()}
                    active={showConfirm}
                    title={'Confirmation'}
                    message={'Deletion can influence on the workflow. Do you really want to remove?'}
                />
            </div>
        );
    }
}

MethodTitle.propTypes = {
    connection: PropTypes.instanceOf(CConnection).isRequired,
    connector: PropTypes.instanceOf(CConnectorItem),
    method: PropTypes.instanceOf(CMethodItem),
    updateEntity: PropTypes.func.isRequired,
    toggleDeleteMethod: PropTypes.func.isRequired,
};


export default MethodTitle;
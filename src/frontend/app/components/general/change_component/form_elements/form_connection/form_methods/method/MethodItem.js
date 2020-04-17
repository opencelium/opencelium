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
import styles from '../../../../../../../themes/default/general/form_methods.scss';

import chroma from 'chroma-js';
import CConnection from "../../../../../../../classes/components/content/connection/CConnection";
import CConnectorItem from "../../../../../../../classes/components/content/connection/CConnectorItem";
import CMethodItem from "../../../../../../../classes/components/content/connection/method/CMethodItem";
import MethodRequest from "./MethodRequest";
import MethodTitle from "./MethodTitle";
import Card from "../../../../../basic_components/card/Card";
import {consoleLog} from "../../../../../../../utils/app";


/**
 * MethodItem Component
 */
class MethodItem extends Component{

    constructor(props){
        super(props);

        this.state = {
            hasDeleteButton: false,
            showSettings: false,
            openSettings: false,
            showConfirm: false,
            onDeleteButtonOver: false,
            showParams: false,
            methodClassName: styles.item_toggle_in,
            isHidden: false,
            deletingMethod: false,
        };
    }

    componentDidUpdate(prevProps, prevState){
        let {showParams, isHidden, deletingMethod} = this.state;
        let methodClassName = '';
        const curMethod = this.props.method;
        const prevMethod = prevProps.method;
        if(deletingMethod){
            methodClassName = styles.item_toggle_out;
            deletingMethod = false;
            this.setState({
                methodClassName,
                deletingMethod,
            });
            return;
        }
        if(curMethod.error.hasError && !this.state.showParams){
            showParams = true;
        }
        if(curMethod.isToggled){
            methodClassName = styles.item_toggle_out;
            isHidden = true;
        } else{
            methodClassName = styles.item_toggle_in;
            isHidden = false;
        }
        if(showParams !== prevState.showParams || methodClassName !== prevState.methodClassName) {
            if(methodClassName === styles.item_toggle_in){
                this.setState({
                    methodClassName,
                    showParams,
                    isHidden,
                });
            } else {
                this.setState({
                    methodClassName,
                    showParams,
                });
            }
        }
        if(isHidden !== prevState.isHidden){
            let that = this;
            if(methodClassName === styles.item_toggle_out){
                setTimeout(() => that.setState({
                    isHidden,
                }), 300);
            }
        }
    }

    toggleDeleteMethod(){
        this.setState({
            deletingMethod: !this.state.deletingMethod,
        });
    }

    updateEntity(){
        const {method, updateEntity} = this.props;
        method.deleteError();
        updateEntity();
    }

    /**
     * to show/hide params
     */
    toggleShowParams(){
        const {method} = this.props;
        method.deleteError();
        this.setState({showParams: !this.state.showParams});
    }

    render(){
        const {methodClassName, isHidden} = this.state;
        if(isHidden){
            return null;
        }
        const {connection, connector, method, readOnly, index} = this.props;
        const {showParams} = this.state;
        let methodStyles = {position: 'relative', transition: 'all 0.3s ease 0s', borderBottomLeftRadius: '3px', borderBottomRightRadius: '3px'};
        let methodTitleStyles = {backgroundColor: method.color};
        let isCurrentItem = connector.getCurrentItem().index === method.index;
        if(isCurrentItem){
            methodTitleStyles.borderBottomStyle = 'none';
            methodStyles.boxShadow = `0 0 0 0 rgba(0, 0, 0, .14), 0px 1px 7px 1px  ${chroma(`${method.color}c2`).darken(3)}, 0 1px 1px 0 rgba(0, 0, 0, .22)`;
            methodStyles.borderRadius = '3px';
        }
        if(method.error.hasError){
            methodStyles.boxShadow = `rgba(0, 0, 0, 0.14) 0px 0px 0px 0px, rgba(230, 0, 0, 0.76) 0px 1px 7px 1px, rgba(0, 0, 0, 0.22) 0px 1px 1px 0px`;
            methodStyles.border = 'border: 1px solid #d14b4b';
        }
        let indexSplitter = method.index.split('_');
        let marginLeftTimes = indexSplitter.length;
        if(marginLeftTimes > 1) {
            methodStyles.marginLeft = (marginLeftTimes - 1) * 20 + 'px';
        }
        return (
            <div id={`${method.index}__${connector.getConnectorType()}`} className={methodClassName} style={{zIndex: 99 - index, position: 'relative'}}>
                <Card
                    theme={{card: styles.item}}
                    style={methodStyles}
                >
                    <MethodTitle
                        connection={connection}
                        connector={connector}
                        method={method}
                        updateEntity={::this.updateEntity}
                        toggleShowParams={::this.toggleShowParams}
                        showParams={showParams}
                        readOnly={readOnly}
                        toggleDeleteMethod={::this.toggleDeleteMethod}
                    />
                    {
                        showParams
                        ?
                            <MethodRequest
                                id={`params_${connector.getConnectorType()}_${method.index}`}
                                readOnly={readOnly}
                                connection={connection}
                                connector={connector}
                                method={method}
                                updateEntity={::this.updateEntity}
                            />
                        :
                            null
                    }
                </Card>
            </div>
        );
    }
}

MethodItem.propTypes = {
    connection: PropTypes.instanceOf(CConnection).isRequired,
    connector: PropTypes.instanceOf(CConnectorItem),
    method: PropTypes.instanceOf(CMethodItem),
    updateEntity: PropTypes.func.isRequired,
};


export default MethodItem;
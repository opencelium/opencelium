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

import chroma from 'chroma-js';
import CConnection from "@entity/connection/components/classes/components/content/connection/CConnection";
import CConnectorItem from "@entity/connection/components/classes/components/content/connection/CConnectorItem";
import CMethodItem from "@entity/connection/components/classes/components/content/connection/method/CMethodItem";
import MethodRequest from "./MethodRequest";
import MethodTitle from "./MethodTitle";
import Card from "@entity/connection/components/components/general/basic_components/card/Card";

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
            methodClassName: '',
            isHidden: false,
            deletingMethod: false,
        };

        this.handleUpdateEntity = this.updateEntity.bind(this);
        this.handleToggleShowParams = this.toggleShowParams.bind(this);
        this.handleToggleDeleteMethod = this.toggleDeleteMethod.bind(this);
        this.hideTimeout = null;
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            nextProps.connection !== this.props.connection ||
            nextProps.connector !== this.props.connector ||
            nextProps.method !== this.props.method ||
            nextProps.readOnly !== this.props.readOnly ||
            nextProps.index !== this.props.index ||
            nextProps.isDraft !== this.props.isDraft ||
            nextState.showParams !== this.state.showParams ||
            nextState.methodClassName !== this.state.methodClassName ||
            nextState.isHidden !== this.state.isHidden ||
            nextState.deletingMethod !== this.state.deletingMethod
        );
    }

    componentDidUpdate(prevProps, prevState){
        const curMethod = this.props.method;
        const nextState = {};

        if (this.state.deletingMethod) {
            if (
                prevState.deletingMethod !== this.state.deletingMethod ||
                this.state.methodClassName !== styles.item_toggle_out
            ) {
                nextState.methodClassName = styles.item_toggle_out;
                nextState.deletingMethod = false;
            }
        } else {
            const shouldShowParams = curMethod.error.hasError ? true : this.state.showParams;
            const nextMethodClassName = curMethod.isToggled ? styles.item_toggle_out : styles.item_toggle_in;
            const nextIsHidden = !!curMethod.isToggled;

            if (shouldShowParams !== this.state.showParams) {
                nextState.showParams = shouldShowParams;
            }

            if (nextMethodClassName !== this.state.methodClassName) {
                nextState.methodClassName = nextMethodClassName;
            }

            if (nextIsHidden !== this.state.isHidden) {
                if (this.hideTimeout) {
                    clearTimeout(this.hideTimeout);
                    this.hideTimeout = null;
                }

                if (nextMethodClassName === styles.item_toggle_out) {
                    this.hideTimeout = setTimeout(() => {
                        this.setState({ isHidden: nextIsHidden });
                        this.hideTimeout = null;
                    }, 300);
                } else {
                    nextState.isHidden = nextIsHidden;
                }
            }
        }

        if (Object.keys(nextState).length > 0) {
            this.setState(nextState);
        }
    }

    componentWillUnmount() {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
    }

    toggleDeleteMethod(){
        this.setState((prevState) => ({
            deletingMethod: !prevState.deletingMethod,
        }));
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
        this.setState((prevState) => ({
            showParams: !prevState.showParams,
        }));
    }

    getMethodStyles(isCurrentItem, hasError, method, index){
        const intend = method.intend * 20 + 'px';

        const methodStyles = {
            position: 'relative',
            transition: 'width 0.5s ease 0s',
            borderBottomLeftRadius: '3px',
            borderBottomRightRadius: '3px',
            width: `calc(100% - ${intend})`,
        };

        const methodTitleStyles = {
            backgroundColor: method.color,
        };

        if(isCurrentItem){
            methodTitleStyles.borderBottomStyle = 'none';
            methodStyles.boxShadow = `0 0 0 0 rgba(0, 0, 0, .14), 0px 1px 7px 1px  ${chroma(`${method.color}c2`).darken(3)}, 0 1px 1px 0 rgba(0, 0, 0, .22)`;
            methodStyles.borderBottomLeftRadius = '3px';
            methodStyles.borderBottomRightRadius = '3px';
            methodStyles.borderTopLeftRadius = '3px';
            methodStyles.borderTopRightRadius = '3px';
        }

        if(hasError){
            methodStyles.boxShadow = `rgba(0, 0, 0, 0.14) 0px 0px 0px 0px, rgba(230, 0, 0, 0.76) 0px 1px 7px 1px, rgba(0, 0, 0, 0.22) 0px 1px 1px 0px`;
            methodStyles.border = '1px solid #d14b4b';
        }

        return {
            intend,
            methodStyles,
            methodTitleStyles,
            wrapperStyle: {
                zIndex: 99 - index,
                position: 'relative',
            },
        };
    }

    render(){
        const {methodClassName, isHidden, showParams} = this.state;

        if(isHidden){
            return null;
        }

        const {connection, connector, method, readOnly, index, isDraft} = this.props;
        const currentItem = connector.getCurrentItem();
        const isCurrentItem = currentItem && currentItem.index === method.index;
        const hasError = !!method.error.hasError;

        const {
            intend,
            methodStyles,
            wrapperStyle,
        } = this.getMethodStyles(isCurrentItem, hasError, method, index);

        return (
            <div
                id={`${method.index}__${connector.getConnectorType()}`}
                className={methodClassName}
                style={wrapperStyle}
            >
                <div style={{display: 'flex'}}>
                    <div
                        style={{
                            height: '57.6px',
                            width: intend,
                            transition: 'width 0.5s ease 0s'
                        }}
                    />
                    <Card
                        theme={{card: styles.item}}
                        style={methodStyles}
                    >
                        <MethodTitle
                            connection={connection}
                            connector={connector}
                            method={method}
                            updateEntity={this.handleUpdateEntity}
                            toggleShowParams={this.handleToggleShowParams}
                            showParams={showParams}
                            readOnly={readOnly}
                            toggleDeleteMethod={this.handleToggleDeleteMethod}
                        />
                        {showParams ? (
                            <MethodRequest
                                id={`params_${connector.getConnectorType()}_${method.index}`}
                                isDraft={isDraft}
                                readOnly={readOnly}
                                connection={connection}
                                connector={connector}
                                method={method}
                                updateEntity={this.handleUpdateEntity}
                            />
                        ) : null}
                    </Card>
                </div>
            </div>
        );
    }
}

MethodItem.propTypes = {
    connection: PropTypes.instanceOf(CConnection).isRequired,
    connector: PropTypes.instanceOf(CConnectorItem),
    method: PropTypes.instanceOf(CMethodItem),
    updateEntity: PropTypes.func.isRequired,
    firstItemIndex: PropTypes.string,
};

MethodItem.defaultProps = {
    firstItemIndex: '0',
    isDraft: false,
};

export default MethodItem;
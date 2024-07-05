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

import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {Col} from "react-grid-system";
import ReactDOM from "react-dom";
import {withTheme} from "styled-components";
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import {setFocusById} from "@application/utils/utils";
import {setCurrentTechnicalItem} from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import {toggleConditionDialog} from "@entity/connection/redux_toolkit/slices/EditorSlice";
import {setModalCurrentTechnicalItem} from "@entity/connection/redux_toolkit/slices/ModalConnectionSlice";
import Dialog from "@entity/connection/components/components/general/basic_components/Dialog";
import {EditIcon, ViewIcon} from "../Icons";
import LeftStatement
    from "./condition/LeftStatement";
import CCondition, {FUNCTIONAL_OPERATORS_FOR_IF, FUNCTIONAL_OPERATORS_FOR_LOOP} from "@entity/connection/components/classes/components/content/connection/operator/CCondition";
import CConnection from "@entity/connection/components/classes/components/content/connection/CConnection";
import COperatorItem, {IF_OPERATOR, LOOP_OPERATOR} from "@entity/connection/components/classes/components/content/connection/operator/COperatorItem";
import RelationalOperator
    from "@change_component/form_elements/form_connection/form_svg/details/description/operator/condition/RelationalOperator";
import {DEFAULT_COLOR} from "@entity/connection/components/classes/components/content/connection/operator/CStatement";
import RightStatement
    from "@change_component/form_elements/form_connection/form_svg/details/description/operator/condition/RightStatement";
import CProcess from "@entity/connection/components/classes/components/content/connection_overview_2/process/CProcess";
import COperator from "@entity/connection/components/classes/components/content/connection_overview_2/operator/COperator";
import Button from "@entity/connection/components/components/general/basic_components/buttons/Button";
import GetModalProp from '@entity/connection/components/decorators/GetModalProp';
import WebhookGenerator from "@change_component/form_elements/form_connection/form_methods/method/WebhookGenerator";
import Webhook from "@root/classes/Webhook";

export const TransitionEffect = 'width 0.3s ease 0s';

function mapStateToProps(state){
    const editor = state.connectionEditorReducer;
    return{
        isConditionDialogOpened: editor.isConditionDialogOpened,
    };
}

@GetModalProp()
@connect(mapStateToProps, {setCurrentTechnicalItem, toggleConditionDialog, setModalCurrentTechnicalItem}, null, {forwardRef: true})
class Condition extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            isMouseOver: false,
            referenceTypeLeft: 'method',
            referenceTypeRight: 'method',
            condition: {
                ...this.getConditionFromProps(props),
            }
        }
        this.setCurrentTechnicalItem = props.isModal ? props.setModalCurrentTechnicalItem : props.setCurrentTechnicalItem;
        this.leftStatementRef = React.createRef();
        this.relationOperatorRef = React.createRef();
        this.rightStatementRef = React.createRef();
    }

    componentDidMount() {
        const {condition} = this.state;
        const referenceTypeLeft = Webhook.isWebhookSnippet(condition.leftParam) && !condition.leftMethod ? 'webhook' : 'method';
        const referenceTypeRight = Webhook.isWebhookSnippet(condition.rightParam) && !condition.rightMethod ? 'webhook' : 'method';
        this.setState({
            referenceTypeLeft,
            referenceTypeRight,
        })
    }

    hasLeftMethod(){
        const {condition} = this.state;
        return condition.leftMethod !== null && !condition.leftMethod.color !== '' && condition.leftMethod.color !== DEFAULT_COLOR;
    }

    hasRightMethod(){
        const {condition} = this.state;
        return condition.rightMethod !== null && condition.rightMethod.color !== '' && condition.rightMethod.color !== DEFAULT_COLOR;
    }

    hasRightParam(){
        const {condition} = this.state;
        if(condition.relationalOperator && CCondition.isLikeOperator(condition.relationalOperator.value)){
            const embracedEmptyValue = CCondition.embraceFieldForLikeOperator('');
            return condition.rightParam !== embracedEmptyValue;
        }
        return condition.rightParam !== '';
    }

    getConditionFromProps(props){
        let leftMethod = null;
        let leftParam = '';
        let relationalOperator = null;
        let property = '';
        let rightMethod = null;
        let rightParam = '';
        if(props) {
            const {connection, details} = props;
            const operator = details.entity;
            const isLoopOperator = operator.type === LOOP_OPERATOR;
            if(connection instanceof CConnection && operator instanceof COperatorItem) {
                const connector = connection.getConnectorByType(details.connectorType);
                leftMethod = connection.getMethodByColor(operator.condition.leftStatement.color);
                if (leftMethod) {
                    leftMethod = leftMethod.getValueForSelectInput(connector);
                }
                leftParam = operator.condition.leftStatement.getFieldWithoutArrayBrackets();
                relationalOperator = operator.condition.relationalOperator;
                if (relationalOperator !== '') {
                    relationalOperator = {value: relationalOperator};
                } else {
                    relationalOperator = null;
                }
                rightMethod = connection.getMethodByColor(operator.condition.rightStatement.color);
                if (rightMethod) {
                    rightMethod = rightMethod.getValueForSelectInput(connector);
                }
                property = operator.condition.rightStatement.getRightPropertyValueWithoutArrayBrackets();
                rightParam = operator.condition.rightStatement.getFieldWithoutArrayBrackets();
                let value = relationalOperator ? relationalOperator.value : null;
                if(value) {
                    const operatorOptions = isLoopOperator ? FUNCTIONAL_OPERATORS_FOR_LOOP : FUNCTIONAL_OPERATORS_FOR_IF;
                    let hasValueItem = operatorOptions.find(fo => fo.value === value);
                    if (hasValueItem) {
                        if(hasValueItem.hasOwnProperty('options')){
                            const option = hasValueItem.options.find(o => o.value === rightParam);
                            if(option){
                                rightParam = option;
                            }
                        }
                    }
                }
            }
        }
        return{
            leftMethod,
            leftParam,
            relationalOperator,
            property,
            rightMethod,
            rightParam,
        };
    }

    updateCondition(condition){
        this.setState({
            condition: {...condition},
        });
    }

    updateRelationalOperator(relationalOperator){
        const {leftMethod, leftParam} = this.state.condition;
        let {rightParam, ...restProps} = this.getConditionFromProps();
        if(relationalOperator && CCondition.isLikeOperator(relationalOperator.value)){
            rightParam = CCondition.embraceFieldForLikeOperator('');
        }
        this.updateCondition({
            ...restProps,
            rightParam,
            relationalOperator,
            leftMethod,
            leftParam,
        });
    }

    mouseOver(){
        if(!this.props.isConditionDialogOpened){
            this.setState({
                isMouseOver: true,
            });
        }
    }

    mouseLeave(){
        if(!this.props.isConditionDialogOpened) {
            this.setState({
                isMouseOver: false,
            });
        }
    }

    toggleEdit(){
        const {setCurrentInfo, nameOfCurrentInfo, isConditionDialogOpened, toggleConditionDialog} = this.props;
        let newState = {
        }
        if(!isConditionDialogOpened){
            newState.condition = this.getConditionFromProps(this.props);
            const referenceTypeLeft = Webhook.isWebhookSnippet(newState.condition.leftParam) && !newState.condition.leftMethod ? 'webhook' : 'method';
            const referenceTypeRight = Webhook.isWebhookSnippet(newState.condition.rightParam) && !newState.condition.rightMethod ? 'webhook' : 'method';
            this.setState({
                referenceTypeLeft,
                referenceTypeRight,
            })
        }
        if(setCurrentInfo) setCurrentInfo(nameOfCurrentInfo);
        toggleConditionDialog()
        this.setState(newState, () => {
            if(isConditionDialogOpened){
                setFocusById('details_condition');
            }
        });
    }

    updateConnection(){
        const {condition} = this.state;
        const {connection, details, updateConnection, setCurrentTechnicalItem, toggleConditionDialog} = this.props;
        const operator = details.entity;
        const connector = connection.getConnectorByType(details.connectorType);
        const operatorItem = connector.getOperatorByIndex(operator.index);
        const {leftParam, leftMethod, rightMethod, relationalOperator, rightParam, property} = condition;
        if(leftMethod) {
            operatorItem.setLeftStatementColor(leftMethod.color);
        } else {
            operatorItem.setLeftStatementColor('');
        }
        if(leftParam){
            operatorItem.setLeftStatementField(leftParam);
            if(leftMethod) {
                operatorItem.setLeftStatementParent(connection.getMethodByColor(leftMethod.color).response.success);
            } else {
                operatorItem.setLeftStatementParent(null);
            }
        }
        if(relationalOperator) operatorItem.setRelationalOperator(relationalOperator.value);
        if(rightMethod) {
            operatorItem.setRightStatementColor(rightMethod.color);
        } else {
            operatorItem.setRightStatementColor('');
        }
        if(rightParam){
            operatorItem.setRightStatementField(rightParam?.value || rightParam);
            if(rightMethod) {
                operatorItem.setRightStatementParent(connection.getMethodByColor(rightMethod.color).response.success);
            } else {
                operatorItem.setRightStatementParent(null);
            }
        }
        if(property) operatorItem.setRightStatementRightPropertyValue(property);
        operatorItem.error = null;
        updateConnection(connection);
        let currentTechnicalItem = connector.getSvgElementByIndex(operator.index);
        this.setCurrentTechnicalItem(currentTechnicalItem.getObject());
        this.setState({
            isMouseOver: false,
        })
        toggleConditionDialog();
    }

    checkIfOperatorHasThreeParams(isForLoop = false){
        const {condition} = this.state;
        let relationalOperatorValue = condition.relationalOperator ? condition.relationalOperator.value : null;
        if(relationalOperatorValue) {
            const operatorOptions = isForLoop ? FUNCTIONAL_OPERATORS_FOR_LOOP : FUNCTIONAL_OPERATORS_FOR_IF;
            let functionalOperator = operatorOptions.find(o => o.value === relationalOperatorValue);
            if (functionalOperator && functionalOperator.hasOwnProperty('hasThreeValues')) {
                return functionalOperator.hasThreeValues;
            }
        }
        return false;
    }

    isOperatorHasValue(isForLoop = false){
        let hasValue = false;
        let isRightStatementText = false;
        let isRightStatementOption = false;
        let isMultiline = false;
        let popupInputStyles = null;
        let options = [];
        const {condition} = this.state;
        let value = condition.relationalOperator ? condition.relationalOperator.value : null;
        if(value) {
            const operatorOptions = isForLoop ? FUNCTIONAL_OPERATORS_FOR_LOOP : FUNCTIONAL_OPERATORS_FOR_IF;
            let hasValueItem = operatorOptions.find(fo => fo.value === value);
            if (hasValueItem) {
                hasValue = hasValueItem.hasValue;
                isRightStatementText = hasValueItem.isRightStatementText;
                if (hasValueItem.hasOwnProperty('isRightStatementOption')) {
                    isRightStatementOption = hasValueItem.isRightStatementOption;
                }
                if (hasValueItem.hasOwnProperty('isMultiline')) {
                    isMultiline = hasValueItem.isMultiline;
                }
                if (hasValueItem.hasOwnProperty('popupInputStyles')) {
                    popupInputStyles = hasValueItem.popupInputStyles;
                }
            }
            if (isRightStatementOption) {
                if (hasValueItem.hasOwnProperty('options')) {
                    options = hasValueItem.options;
                }
            }
        }
        return {hasValue, isRightStatementText, isRightStatementOption, options, isMultiline, popupInputStyles} ;
    }
    onChangeReferenceTypeLeft(referenceTypeLeft) {
        const {condition} = this.state;
        this.updateCondition({
            ...condition,
            leftMethod: null,
            leftParam: '',
            property: '',
        });
        this.setState({
            referenceTypeLeft,
        })
    }
    onChangeReferenceTypeRight(referenceTypeRight) {
        const {condition} = this.state;
        this.updateCondition({
            ...condition,
            property: '',
            rightMethod: null,
            rightParam: '',
        });
        this.setState({
            referenceTypeRight,
        })
    }

    updateLeftWebhook(webhookValue) {
        const {condition} = this.state;
        this.updateCondition({
            ...condition,
            leftMethod: null,
            leftParam: Webhook.embraceWithSnippet(webhookValue),
        });
    }
    updateRightWebhook(webhookValue) {
        const {condition} = this.state;
        this.updateCondition({
            ...condition,
            rightMethod: null,
            property: '',
            rightParam: Webhook.embraceWithSnippet(webhookValue),
        });
    }
    renderType(side, isHidden) {
        const {referenceTypeLeft, referenceTypeRight} = this.state;
        const referenceType = side === 'left' ? referenceTypeLeft : referenceTypeRight;
        const changeReferenceType = side === 'left' ? (a) => this.onChangeReferenceTypeLeft(a) : (a) => this.onChangeReferenceTypeRight(a);
        return (
            <div style={{
                float: 'left',
                display: 'grid',
                height: '39px',
                marginTop: '-1px',
                width: isHidden ? '0' : '4%',
                borderBottom: '1px solid #2121211f',
                paddingBottom: '9px',
                overflow: 'hidden',
                transition: TransitionEffect,
            }}>
                <div style={{height: '14px'}} title={'method'} onClick={() => changeReferenceType('method')}>
                    <span style={{fontSize: '14px'}} className="mdi mdi-vector-radius"></span>
                    <input style={{height: '10px'}} type={'radio'} checked={referenceType === 'method'} onChange={() => changeReferenceType('method')}/>
                </div>
                <div style={{height: '14px'}} title={'webhook'} onClick={() => changeReferenceType('webhook')}>
                    <span style={{fontSize: '14px'}} className="mdi mdi-webhook"></span>
                    <input style={{height: '10px'}} type={'radio'} checked={referenceType === 'webhook'} onChange={() => changeReferenceType('webhook')}/>
                </div>
            </div>
        )
    }

    getWebhookLeftStyle() {
        const {referenceTypeRight} = this.state;
        let {hasValue} = this.isOperatorHasValue();
        const isOperatorHasThreeParams = this.checkIfOperatorHasThreeParams(false);
        //let width = hasValue ? '6%' : '16%';
        let width = hasValue ? isOperatorHasThreeParams ? referenceTypeRight === 'webhook' ? '41%' : '34%' : '41%' : '68%';
        return {
            float: 'left',
            width,
            //transition: TransitionEffect,
        }
    }

    getWebhookRightStyle() {
        let {hasValue} = this.isOperatorHasValue();
        let styles = {float: 'left'};
        if (hasValue) {
            styles.width = '40%';
            styles.transition = TransitionEffect;
        } else {
            styles.width = '0';
            styles.overflow = 'hidden';
        }
        return styles;
    }

    renderInfo(){
        const {condition, referenceTypeLeft, referenceTypeRight} = this.state;
        const {connection, details, readOnly, isExtended} = this.props;
        const operator = details.entity;
        const connector = connection.getConnectorByType(details.connectorType);
        const isLoopOperator = operator.type === LOOP_OPERATOR;
        const isLeftInputStringForLoopOperator = true;
        const isIfOperator = operator.type === IF_OPERATOR;
        let relationalOperatorValue = condition.relationalOperator ? condition.relationalOperator.value : null;
        const operatorOptions = isLoopOperator ? FUNCTIONAL_OPERATORS_FOR_LOOP : FUNCTIONAL_OPERATORS_FOR_IF;
        let functionalOperator = operatorOptions.find(o => o.value === relationalOperatorValue);
        const placeholder = functionalOperator?.placeholder || '';
        return(
            <React.Fragment>
                {this.renderType('left')}
                {referenceTypeLeft === 'method' &&
                    <LeftStatement
                        ref={this.leftStatementRef}
                        {...this.props}
                        operator={operator}
                        condition={condition}
                        connector={connector}
                        isLoopOperator={false}
                        referenceTypeRight={referenceTypeRight}
                        hasLeftMethod={this.hasLeftMethod()}
                        isOperatorHasThreeParams={this.checkIfOperatorHasThreeParams(isLoopOperator)}
                        updateCondition={(a) => this.updateCondition(a)}
                        getConditionFromProps={(a) => this.getConditionFromProps(a)}
                        isOperatorHasValue={() => this.isOperatorHasValue(isLoopOperator)}
                    />
                }
                {referenceTypeLeft === 'webhook' &&
                    <WebhookGenerator value={Webhook.extractFromSnippet(condition.leftParam)} style={this.getWebhookLeftStyle()} readOnly={readOnly} onSelect={(a) => this.updateLeftWebhook(a)}/>
                }
                {(isIfOperator || isLeftInputStringForLoopOperator) &&
                <React.Fragment>
                    <RelationalOperator
                        ref={this.relationOperatorRef}
                        isLoopOperator={isLoopOperator}
                        isIfOperator={isIfOperator}
                        relationalOperator={condition.relationalOperator}
                        readOnly={readOnly}
                        referenceTypeLeft={referenceTypeLeft}
                        referenceTypeRight={referenceTypeRight}
                        hasMethod={this.hasLeftMethod()}
                        isOperatorHasThreeParams={this.checkIfOperatorHasThreeParams(isLoopOperator)}
                        updateRelationalOperator={(a) => this.updateRelationalOperator(a)}
                        isOperatorHasValue={() => this.isOperatorHasValue(isLoopOperator)}
                    />
                    {this.renderType('right', !this.isOperatorHasValue(isLoopOperator).hasValue)}
                    {referenceTypeRight === 'method' && <RightStatement
                        ref={this.rightStatementRef}
                        {...this.props}
                        placeholder={placeholder}
                        condition={condition}
                        connector={connector}
                        operator={operator}
                        hasLeftMethod={this.hasLeftMethod()}
                        hasRightMethod={this.hasRightMethod()}
                        hasRightParam={this.hasRightParam()}
                        isOperatorHasThreeParams={this.checkIfOperatorHasThreeParams(isLoopOperator)}
                        updateCondition={(a) => this.updateCondition(a)}
                        getConditionFromProps={(a) => this.getConditionFromProps(a)}
                        isOperatorHasValue={() => this.isOperatorHasValue(isLoopOperator)}
                    />}
                    {referenceTypeRight === 'webhook' &&
                        <WebhookGenerator value={Webhook.extractFromSnippet(condition.rightParam)} style={this.getWebhookRightStyle()} readOnly={readOnly} onSelect={(a) => this.updateRightWebhook(a)}/>
                    }
                </React.Fragment>
                }
                {isExtended &&
                    <Button
                        className={styles.extended_details_button_save_condition}
                        title={'Save'}
                        onClick={(a) => this.updateConnection(a)}
                    />
                }
            </React.Fragment>
        );
    }

    render(){
        const {isMouseOver} = this.state;
        const {details, isExtended, isCurrentInfo, readOnly, theme, connection, isConditionDialogOpened} = this.props;
        const operator = details.entity;
        const conditionText = operator.condition.generateStatementText();
        const conditionTextTitle = operator.condition.generateStatementText(true);
        const label = readOnly ? 'Ok' : 'Apply';
        const errorColor = theme?.input?.error?.color || '#9b2e2e';
        const connector = connection.getConnectorByType(details.connectorType);
        const errorMessages = connector ? connector.getOperatorByIndex(operator.index)?.error?.messages || [] : [];
        return(
            <React.Fragment>
                <Col id='condition_name' xs={4} className={styles.col} style={{color: errorMessages.length > 0 ? errorColor : '#000'}}>{`Condition`}</Col>
                <Col id="condition_label" xs={8} className={styles.col} onMouseOver={(a) => this.mouseOver(a)} onMouseLeave={(a) => this.mouseLeave(a)}>
                    <span className={styles.value} title={conditionTextTitle} style={{color: errorMessages.length > 0 ? errorColor : '#000'}}>{conditionText}</span>
                    {isMouseOver && !isConditionDialogOpened && !readOnly && <EditIcon onClick={(a) => this.toggleEdit(a)}/>}
                    {isMouseOver && !isConditionDialogOpened && readOnly && <ViewIcon onClick={(a) => this.toggleEdit(a)}/>}
                    {isExtended && isCurrentInfo &&
                        ReactDOM.createPortal(
                            this.renderInfo(), document.getElementById('extended_details_information')
                        )
                    }
                    <Dialog
                        actions={[{label, onClick: (a) => this.updateConnection(a), id: 'condition_apply'}]}
                        active={isConditionDialogOpened && !isExtended}
                        toggle={(a) => this.toggleEdit(a)}
                        title={'Condition'}
                        theme={{
                            dialog: styles.condition_dialog,
                            content: styles.condition_content,
                            body: styles.condition_body,
                        }}
                    >
                        {this.renderInfo()}
                    </Dialog>
                </Col>
            </React.Fragment>
        );
    }
}

Condition.propTypes = {
    details: PropTypes.oneOfType([PropTypes.instanceOf(CProcess), PropTypes.instanceOf(COperator), PropTypes.oneOf([null])]).isRequired,
}


export default withTheme(Condition);

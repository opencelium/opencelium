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
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import {setFocusById} from "@application/utils/utils";
import {setCurrentTechnicalItem} from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import Dialog from "@entity/connection/components/components/general/basic_components/Dialog";
import {EditIcon, ViewIcon} from "../Icons";
import LeftStatement
    from "./condition/LeftStatement";
import CCondition, {FUNCTIONAL_OPERATORS} from "@entity/connection/components/classes/components/content/connection/operator/CCondition";
import CConnection from "@entity/connection/components/classes/components/content/connection/CConnection";
import COperatorItem, {IF_OPERATOR, LOOP_OPERATOR} from "@entity/connection/components/classes/components/content/connection/operator/COperatorItem";
import RelationalOperator
    from "@change_component/form_elements/form_connection/form_svg/details/description/operator/condition/RelationalOperator";
import {DEFAULT_COLOR} from "@entity/connection/components/classes/components/content/connection/operator/CStatement";
import RightStatement
    from "@change_component/form_elements/form_connection/form_svg/details/description/operator/condition/RightStatement";
import CProcess from "@entity/connection/components/classes/components/content/connection_overview_2/process/CProcess";
import COperator from "@entity/connection/components/classes/components/content/connection_overview_2/operator/COperator";
import ReactDOM from "react-dom";
import Button from "@entity/connection/components/components/general/basic_components/buttons/Button";
import {withTheme} from "styled-components";


@connect(null, {setCurrentTechnicalItem})
class Condition extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            isMouseOver: false,
            isOpenEditDialog: false,
            condition: {
                ...this.getConditionFromProps(props),
            }
        }
    }

    hasLeftMethod(){
        const {condition} = this.state;
        return condition.leftMethod !== null && condition.leftMethod.color !== '' && condition.leftMethod.color !== DEFAULT_COLOR;
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
        if(!this.state.isOpenEditDialog){
            this.setState({
                isMouseOver: true,
            });
        }
    }

    mouseLeave(){
        if(!this.state.isOpenEditDialog) {
            this.setState({
                isMouseOver: false,
            });
        }
    }

    toggleEdit(){
        const {setCurrentInfo, nameOfCurrentInfo} = this.props;
        let newState = {
            isOpenEditDialog: !this.state.isOpenEditDialog,
        }
        if(newState.isOpenEditDialog){
            newState.condition = this.getConditionFromProps(this.props);
        }
        if(setCurrentInfo) setCurrentInfo(nameOfCurrentInfo);
        this.setState(newState, () => {
            if(this.state.isOpenEditDialog){
                setFocusById('details_condition');
            }
        });
    }

    updateConnection(){
        const {condition} = this.state;
        const {connection, details, updateConnection, setCurrentTechnicalItem} = this.props;
        const operator = details.entity;
        const connector = connection.getConnectorByType(details.connectorType);
        const operatorItem = connector.getOperatorByIndex(operator.index);
        const {leftParam, leftMethod, rightMethod, relationalOperator, rightParam, property} = condition;
        if(leftMethod) operatorItem.setLeftStatementColor(leftMethod.color);
        if(leftParam){
            operatorItem.setLeftStatementField(leftParam);
            if(leftMethod) operatorItem.setLeftStatementParent(connection.getMethodByColor(leftMethod.color).response.success);
        }
        if(relationalOperator) operatorItem.setRelationalOperator(relationalOperator.value);
        if(rightMethod) operatorItem.setRightStatementColor(rightMethod.color);
        if(rightParam){
            operatorItem.setRightStatementField(rightParam);
            if(rightMethod) operatorItem.setRightStatementParent(connection.getMethodByColor(rightMethod.color).response.success);
        }
        if(property) operatorItem.setRightStatementRightPropertyValue(property);
        operatorItem.error = null;
        updateConnection(connection);
        let currentTechnicalItem = connector.getSvgElementByIndex(operator.index);
        setCurrentTechnicalItem(currentTechnicalItem.getObject());
        this.setState({
            isOpenEditDialog: !this.state.isOpenEditDialog,
            isMouseOver: false,
        })
    }

    checkIfOperatorHasThreeParams(){
        const {condition} = this.state;
        let relationalOperatorValue = condition.relationalOperator ? condition.relationalOperator.value : null;
        if(relationalOperatorValue) {
            let functionalOperator = FUNCTIONAL_OPERATORS.find(o => o.value === relationalOperatorValue);
            if (functionalOperator && functionalOperator.hasOwnProperty('hasThreeValues')) {
                return functionalOperator.hasThreeValues;
            }
        }
        return false;
    }

    isOperatorHasValue(){
        let hasValue = false;
        let isRightStatementText = false;
        let isRightStatementOption = false;
        let isMultiline = false;
        let popupInputStyles = null;
        let options = [];
        const {condition} = this.state;
        let value = condition.relationalOperator ? condition.relationalOperator.value : null;
        if(value) {
            let hasValueItem = FUNCTIONAL_OPERATORS.find(fo => fo.value === value);
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

    renderInfo(){
        const {isOpenEditDialog, condition} = this.state;
        const {connection, details, readOnly, isExtended} = this.props;
        const operator = details.entity;
        const connector = connection.getConnectorByType(details.connectorType);
        const isLoopOperator = operator.type === LOOP_OPERATOR;
        const isIfOperator = operator.type === IF_OPERATOR;
        return(
            <React.Fragment>
                <LeftStatement
                    {...this.props}
                    operator={operator}
                    condition={condition}
                    connector={connector}
                    isLoopOperator={isLoopOperator}
                    hasLeftMethod={this.hasLeftMethod()}
                    isOperatorHasThreeParams={this.checkIfOperatorHasThreeParams()}
                    updateCondition={(a) => this.updateCondition(a)}
                    getConditionFromProps={(a) => this.getConditionFromProps(a)}
                    isOperatorHasValue={(a) => this.isOperatorHasValue(a)}
                />
                {isIfOperator &&
                <React.Fragment>
                    <RelationalOperator
                        relationalOperator={condition.relationalOperator}
                        readOnly={readOnly}
                        hasMethod={this.hasLeftMethod()}
                        isOperatorHasThreeParams={this.checkIfOperatorHasThreeParams()}
                        updateRelationalOperator={(a) => this.updateRelationalOperator(a)}
                        isOperatorHasValue={(a) => this.isOperatorHasValue(a)}
                    />
                    <RightStatement
                        {...this.props}
                        condition={condition}
                        connector={connector}
                        operator={operator}
                        hasLeftMethod={this.hasLeftMethod()}
                        hasRightMethod={this.hasRightMethod()}
                        hasRightParam={this.hasRightParam()}
                        isOperatorHasThreeParams={this.checkIfOperatorHasThreeParams()}
                        updateCondition={(a) => this.updateCondition(a)}
                        getConditionFromProps={(a) => this.getConditionFromProps(a)}
                        isOperatorHasValue={(a) => this.isOperatorHasValue(a)}
                    />
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
        const {isMouseOver, isOpenEditDialog} = this.state;
        const {details, isExtended, isCurrentInfo, readOnly, theme, connection} = this.props;
        const operator = details.entity;
        const conditionText = operator.condition.generateStatementText();
        const conditionTextTitle = operator.condition.generateStatementText(true);
        const label = readOnly ? 'Ok' : 'Apply';
        const errorColor = theme?.input?.error?.color || '#9b2e2e';
        const connector = connection.getConnectorByType(details.connectorType);
        const errorMessages = connector ? connector.getOperatorByIndex(operator.index)?.error?.messages || [] : [];
        return(
            <React.Fragment>
                <Col xs={4} className={styles.col} style={{color: errorMessages.length > 0 ? errorColor : '#000'}}>{`Condition`}</Col>
                <Col xs={8} className={styles.col} onMouseOver={(a) => this.mouseOver(a)} onMouseLeave={(a) => this.mouseLeave(a)}>
                    <span className={styles.value} title={conditionTextTitle} style={{color: errorMessages.length > 0 ? errorColor : '#000'}}>{conditionText}</span>
                    {isMouseOver && !isOpenEditDialog && !readOnly && <EditIcon onClick={(a) => this.toggleEdit(a)}/>}
                    {isMouseOver && !isOpenEditDialog && readOnly && <ViewIcon onClick={(a) => this.toggleEdit(a)}/>}
                    {isExtended && isCurrentInfo &&
                        ReactDOM.createPortal(
                            this.renderInfo(), document.getElementById('extended_details_information')
                        )
                    }
                    <Dialog
                        actions={[{label, onClick: (a) => this.updateConnection(a), id: 'condition_apply'}]}
                        active={isOpenEditDialog && !isExtended}
                        toggle={(a) => this.toggleEdit(a)}
                        title={'Condition'}
                        theme={{dialog: styles.condition_dialog}}
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
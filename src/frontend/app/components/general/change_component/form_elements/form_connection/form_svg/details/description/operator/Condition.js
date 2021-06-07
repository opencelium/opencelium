import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {Col} from "react-grid-system";
import styles from "@themes/default/content/connections/connection_overview_2";
import {setFocusById} from "@utils/app";
import {setCurrentTechnicalItem} from "@actions/connection_overview_2/set";
import Dialog from "@basic_components/Dialog";
import {EditIcon} from "../Icons";
import LeftStatement
    from "./condition/LeftStatement";
import {FUNCTIONAL_OPERATORS} from "@classes/components/content/connection/operator/CCondition";
import CConnection from "@classes/components/content/connection/CConnection";
import COperatorItem, {IF_OPERATOR, LOOP_OPERATOR} from "@classes/components/content/connection/operator/COperatorItem";
import RelationalOperator
    from "@change_component/form_elements/form_connection/form_svg/details/description/operator/condition/RelationalOperator";
import {DEFAULT_COLOR} from "@classes/components/content/connection/operator/CStatement";
import RightStatement
    from "@change_component/form_elements/form_connection/form_svg/details/description/operator/condition/RightStatement";
import CProcess from "@classes/components/content/connection_overview_2/process/CProcess";
import COperator from "@classes/components/content/connection_overview_2/operator/COperator";


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
        this.updateCondition({
            ...this.getConditionFromProps(),
            relationalOperator,
            leftMethod,
            leftParam,
        });
    }

    mouseOver(){
        this.setState({
            isMouseOver: true,
        });
    }

    mouseLeave(){
        this.setState({
            isMouseOver: false,
        });
    }

    toggleEdit(){
        let newState = {
            isOpenEditDialog: !this.state.isOpenEditDialog,
        }
        if(newState.isOpenEditDialog){
            newState.condition = this.getConditionFromProps(this.props);
        }
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
        updateConnection(); 
        let currentItem = connector.getSvgElementByIndex(operator.index);
        setCurrentTechnicalItem(currentItem);
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


    render(){
        const {isMouseOver, isOpenEditDialog, condition} = this.state;
        const {connection, details, readOnly} = this.props;
        const operator = details.entity;
        const connector = connection.getConnectorByType(details.connectorType);
        const conditionText = operator.condition.generateStatementText();
        const conditionTextTitle = operator.condition.generateStatementText(true);
        const isLoopOperator = operator.type === LOOP_OPERATOR;
        const isIfOperator = operator.type === IF_OPERATOR;
        return(
            <React.Fragment>
                <Col xs={4} className={styles.col}>{`Condition`}</Col>
                <Col xs={8} className={styles.col} onMouseOver={::this.mouseOver} onMouseLeave={::this.mouseLeave}>
                    <span className={styles.value} title={conditionTextTitle}>{conditionText}</span>
                    {isMouseOver && !isOpenEditDialog && <EditIcon onClick={::this.toggleEdit}/>}
                    <Dialog
                        actions={[{label: 'Apply', onClick: ::this.updateConnection, id: 'condition_apply'}]}
                        active={isOpenEditDialog}
                        toggle={::this.toggleEdit}
                        title={'Condition'}
                        theme={{dialog: styles.condition_dialog}}
                    >
                        <LeftStatement
                            {...this.props}
                            condition={condition}
                            connector={connector}
                            isLoopOperator={isLoopOperator}
                            hasLeftMethod={this.hasLeftMethod()}
                            isOperatorHasThreeParams={this.checkIfOperatorHasThreeParams()}
                            updateCondition={::this.updateCondition}
                            getConditionFromProps={::this.getConditionFromProps}
                            isOperatorHasValue={::this.isOperatorHasValue}
                        />
                        {isIfOperator &&
                            <React.Fragment>
                                <RelationalOperator
                                    relationalOperator={condition.relationalOperator}
                                    readOnly={readOnly}
                                    hasMethod={this.hasLeftMethod()}
                                    isOperatorHasThreeParams={this.checkIfOperatorHasThreeParams()}
                                    updateRelationalOperator={::this.updateRelationalOperator}
                                    isOperatorHasValue={::this.isOperatorHasValue}
                                />
                                <RightStatement
                                    {...this.props}
                                    condition={condition}
                                    connector={connector}
                                    hasLeftMethod={this.hasLeftMethod()}
                                    hasRightMethod={this.hasRightMethod()}
                                    hasRightParam={this.hasRightParam()}
                                    isOperatorHasThreeParams={this.checkIfOperatorHasThreeParams()}
                                    updateCondition={::this.updateCondition}
                                    getConditionFromProps={::this.getConditionFromProps}
                                    isOperatorHasValue={::this.isOperatorHasValue}
                                />
                            </React.Fragment>
                        }
                    </Dialog>
                </Col>
            </React.Fragment>
        );
    }
}

Condition.propTypes = {
    details: PropTypes.oneOfType([PropTypes.instanceOf(CProcess), PropTypes.instanceOf(COperator), null]).isRequired,
}


export default Condition;
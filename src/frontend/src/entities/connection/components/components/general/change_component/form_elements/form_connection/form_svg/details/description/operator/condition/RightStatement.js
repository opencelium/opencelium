/*
 *  Copyright (C) <2022>  <becon GmbH>
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
import MethodSelect from "./MethodSelect";
import ParamInput from "./ParamInput";
import PropertyInput
    from "@change_component/form_elements/form_connection/form_svg/details/description/operator/condition/PropertyInput";
import ParamSelect
    from "@change_component/form_elements/form_connection/form_svg/details/description/operator/condition/ParamSelect";
import {LikePercentageStyled} from "./styles";
import CCondition from "@classes/content/connection/operator/CCondition";

class RightStatement extends React.Component{
    constructor(props) {
        super(props);
    }

    updateMethod(method){
        const {condition, updateCondition, getConditionFromProps} = this.props;
        updateCondition({
            ...getConditionFromProps(),
            leftMethod: condition.leftMethod,
            leftParam: condition.leftParam,
            relationalOperator: condition.relationalOperator,
            property: condition.property,
            rightMethod: method,
        });
    }

    updateParam(param){
        const {condition, updateCondition, getConditionFromProps} = this.props;
        if(this.isLikeOperator()){
            if(condition.rightParam.length > 1){
                param = CCondition.embraceFieldForLikeOperator(param);
                if(condition.rightParam[0] === '%'){
                    param = `%${param}`;
                }
                if(condition.rightParam[condition.rightParam.length - 1] === '%'){
                    param += '%';
                }
            }
        }
        updateCondition({
            ...getConditionFromProps(),
            leftMethod: condition.leftMethod,
            leftParam: condition.leftParam,
            relationalOperator: condition.relationalOperator,
            property: condition.property,
            rightMethod: condition.rightMethod,
            rightParam: param,
        });
    }

    updateProperty(property){
        const {condition, updateCondition,} = this.props;
        updateCondition({
            ...condition,
            property,
        });
    }

    isMethodVisible(){
        const {isOperatorHasValue, hasRightParam, hasRightMethod} = this.props;
        const {hasValue, isRightStatementText, isRightStatementOption} = isOperatorHasValue();
        let isVisible = hasValue && !(hasRightParam && !hasRightMethod);
        if(isRightStatementText || isRightStatementOption){
            isVisible = false;
        }
        return isVisible;
    }

    getPropertyStyles(){
        const {isOperatorHasThreeParams} = this.props;
        let style = {transition: isOperatorHasThreeParams ? 'width 0.3s ease 0s' : 'none', width: isOperatorHasThreeParams ? '17.5%' : '0', float: 'left'};
        let equalStyle = {transition: isOperatorHasThreeParams ? 'width 0.3s ease 0s' : 'none', width: isOperatorHasThreeParams ? '5%' : '0'};
        return {style, equalStyle}
    }

    getMethodStyles(){
        const isMethodVisible = this.isMethodVisible();
        return  {width: isMethodVisible ? '10%' : '0', float: 'left', maxHeight: '38px', transition: isMethodVisible ? 'width 0.3s ease 0s' : 'none', padding: 0};
    }

    getParamStyles(){
        const {isOperatorHasThreeParams, isOperatorHasValue, hasRightMethod, hasRightParam, condition} = this.props;
        let {hasValue, isRightStatementText} = isOperatorHasValue();
        const isLikeOperator = this.isLikeOperator();
        let isMethodSelectRightInvisible = !hasRightMethod && hasRightParam || isRightStatementText;
        let width = hasValue ? isMethodSelectRightInvisible ? isOperatorHasThreeParams ? '25.5%' : '45%' : isOperatorHasThreeParams ? '15.5%' : '35%' : '0';
        if(isLikeOperator){
            width = '25%';
        }
        return {transition: hasValue ? 'width 0.3s ease 0s' : 'none', width, float: 'left'};
    }

    getParamSelectStyles(){
        const {isOperatorHasThreeParams, isOperatorHasValue, hasRightMethod, hasRightParam} = this.props;
        let {hasValue, isRightStatementText} = isOperatorHasValue();
        let isMethodSelectRightInvisible = !hasRightMethod && hasRightParam || isRightStatementText;
        return {transition: hasValue ? 'width 0.3s ease 0s' : 'none', width: hasValue ? isMethodSelectRightInvisible ? isOperatorHasThreeParams ? '27.5%' : '45%' : isOperatorHasThreeParams ? '15.5%' : '45%' : '0', float: 'left'};
    }

    isLikeOperator(){
        const {condition} = this.props;
        return condition && condition.relationalOperator && condition.relationalOperator.value && condition.relationalOperator.value === "LIKE";
    }

    setLeftLikeSign(){
        const {condition, updateCondition, getConditionFromProps} = this.props;
        let rightParam = condition.rightParam;
        const splitRightParam = rightParam.split('{');
        if(splitRightParam.length > 1){
            if(splitRightParam[1][0] === '}'){
                return;
            }
        }
        if(rightParam[0] === '%'){
            rightParam = rightParam.substring(1);
        } else{
            rightParam = `%${rightParam}`;
        }
        updateCondition({
            ...getConditionFromProps(),
            leftMethod: condition.leftMethod,
            leftParam: condition.leftParam,
            relationalOperator: condition.relationalOperator,
            property: condition.property,
            rightMethod: condition.rightMethod,
            rightParam: rightParam,
        });
    }

    setRightLikeSign(){
        const {condition, updateCondition, getConditionFromProps} = this.props;
        let rightParam = condition.rightParam;
        const splitRightParam = rightParam.split('{');
        if(splitRightParam.length > 1){
            if(splitRightParam[1][0] === '}'){
                return;
            }
        }
        if(rightParam[rightParam.length - 1] === '%'){
            rightParam = rightParam.substr(0, rightParam.length - 1);
        } else{
            rightParam += '%';
        }
        updateCondition({
            ...getConditionFromProps(),
            leftMethod: condition.leftMethod,
            leftParam: condition.leftParam,
            relationalOperator: condition.relationalOperator,
            property: condition.property,
            rightMethod: condition.rightMethod,
            rightParam: rightParam,
        });
    }

    render(){
        let {condition, connection, connector, operator, readOnly, isOperatorHasValue, isOperatorHasThreeParams, hasLeftMethod, hasRightMethod, hasRightParam, updateConnection} = this.props;
        let {hasValue, isMultiline, isRightStatementOption, options} = isOperatorHasValue();
        const propertyId = `if_operator_property_${operator.index}`;
        const propertyItems = hasLeftMethod ? connection.getConnectorMethodByColor(condition.leftMethod.color).response.success : [];
        const isPropertyDisabled = !isOperatorHasThreeParams;
        let methodSource = connection.getOptionsForMethods(connector, operator, {statement: 'rightStatement', isKeyConsidered: false, exceptCurrent: false});
        if(methodSource.length === 0) {
            methodSource = [{label: 'No params', value: 0, color: 'white'}];
        }
        const methodPlaceholder = !hasRightMethod && hasRightParam ? '' : '...';
        const isMethodVisible = this.isMethodVisible();
        const isMethodDisabled = readOnly || !isMethodVisible;
        const isMethodSearchable = !readOnly;
        let paramItems = hasRightMethod ? connection.getConnectorMethodByColor(condition.rightMethod.color).response.success : null;
        const paramId = `${connector.getConnectorType()}_if_operator_${operator.type}_${operator.index}`;
        const isLikeOperator = this.isLikeOperator();
        let hasLeftLikeSign = false;
        let hasRightLikeSign = false;
        let rightParam = condition.rightParam;
        if(isLikeOperator){
            if(rightParam.length > 1){
                if(rightParam[rightParam.length - 1] === '%'){
                    hasRightLikeSign = true;
                    rightParam = rightParam.substr(0, rightParam.length - 1);
                }
                if(rightParam[0] === '%'){
                    hasLeftLikeSign = true;
                    rightParam = rightParam.substr(1, rightParam.length);
                }
                rightParam = CCondition.excludeFieldFromLikeOperator(rightParam);
            }
        }
        return(
            <React.Fragment>
                <LikePercentageStyled isLikeOperator={isLikeOperator} hasSign={hasLeftLikeSign}>
                    <div onClick={() => this.setLeftLikeSign()}>%</div>
                </LikePercentageStyled>
                <PropertyInput
                    {...this.getPropertyStyles()}
                    selectedMethod={condition.leftMethod ? connection.getMethodByColor(condition.leftMethod.color) : null}
                    selectedConnector={condition.leftMethod ? connection.getConnectorByMethodColor(condition.leftMethod.color) : null}
                    connection={connection}
                    updateConnection={updateConnection}
                    id={propertyId}
                    readOnly={readOnly}
                    connector={connector}
                    isDisabled={isPropertyDisabled}
                    updateProperty={(a) => this.updateProperty(a)}
                    items={propertyItems}
                    predicator={condition.leftParam}
                    property={condition.property}
                />
                <MethodSelect
                    readOnly={readOnly}
                    hasValue={hasValue}
                    method={condition.rightMethod}
                    source={methodSource}
                    updateMethod={(a) => this.updateMethod(a)}
                    style={this.getMethodStyles()}
                    placeholder={methodPlaceholder}
                    isDisabled={isMethodDisabled}
                    isSearchable={isMethodSearchable}
                />
                {isRightStatementOption ?
                    <ParamSelect
                        id={paramId}
                        readOnly={readOnly}
                        hasMethod={hasRightMethod}
                        connector={connector}
                        param={rightParam}
                        options={options}
                        updateParam={(a) => this.updateParam(a)}
                        style={this.getParamSelectStyles()}
                    /> :
                    <ParamInput
                        id={paramId}
                        selectedMethod={condition.rightMethod ? connection.getMethodByColor(condition.rightMethod.color) : null}
                        selectedConnector={condition.rightMethod ? connection.getConnectorByMethodColor(condition.rightMethod.color) : null}
                        connection={connection}
                        updateConnection={updateConnection}
                        readOnly={readOnly}
                        hasMethod={hasRightMethod}
                        connector={connector}
                        param={rightParam}
                        items={paramItems}
                        updateParam={(a) => this.updateParam(a)}
                        style={this.getParamStyles()}
                        isMultiline={isMultiline}
                    />
                }
                <LikePercentageStyled isLikeOperator={isLikeOperator} hasSign={hasRightLikeSign}>
                    <div onClick={() => this.setRightLikeSign()}>%</div>
                </LikePercentageStyled>
            </React.Fragment>
        );
    }
}

export default RightStatement;
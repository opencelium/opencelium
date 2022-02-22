import React from 'react';
import MethodSelect from "./MethodSelect";
import ParamInput from "./ParamInput";
import {DEFAULT_COLOR} from "@classes/components/content/connection/operator/CStatement";
import PropertyInput
    from "@change_component/form_elements/form_connection/form_svg/details/description/operator/condition/PropertyInput";
import ParamSelect
    from "@change_component/form_elements/form_connection/form_svg/details/description/operator/condition/ParamSelect";

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
        const {isOperatorHasThreeParams, isOperatorHasValue, hasRightMethod, hasRightParam} = this.props;
        let {hasValue, isRightStatementText} = isOperatorHasValue();
        let isMethodSelectRightInvisible = !hasRightMethod && hasRightParam || isRightStatementText;
        return {transition: hasValue ? 'width 0.3s ease 0s' : 'none', width: hasValue ? isMethodSelectRightInvisible ? isOperatorHasThreeParams ? '25.5%' : '45%' : isOperatorHasThreeParams ? '15.5%' : '35%' : '0', float: 'left'};
    }

    getParamSelectStyles(){
        const {isOperatorHasThreeParams, isOperatorHasValue, hasRightMethod, hasRightParam} = this.props;
        let {hasValue, isRightStatementText} = isOperatorHasValue();
        let isMethodSelectRightInvisible = !hasRightMethod && hasRightParam || isRightStatementText;
        return {transition: hasValue ? 'width 0.3s ease 0s' : 'none', width: hasValue ? isMethodSelectRightInvisible ? isOperatorHasThreeParams ? '27.5%' : '45%' : isOperatorHasThreeParams ? '15.5%' : '45%' : '0', float: 'left'};
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
        return(
            <React.Fragment>
                <PropertyInput
                    {...this.getPropertyStyles()}
                    updateConnection={updateConnection}
                    id={propertyId}
                    readOnly={readOnly}
                    connector={connector}
                    isDisabled={isPropertyDisabled}
                    updateProperty={::this.updateProperty}
                    items={propertyItems}
                    predicator={condition.leftParam}
                    property={condition.property}
                />
                <MethodSelect
                    readOnly={readOnly}
                    hasValue={hasValue}
                    method={condition.rightMethod}
                    source={methodSource}
                    updateMethod={::this.updateMethod}
                    style={::this.getMethodStyles()}
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
                        param={condition.rightParam}
                        options={options}
                        updateParam={::this.updateParam}
                        style={::this.getParamSelectStyles()}
                    /> :
                    <ParamInput
                        id={paramId}
                        updateConnection={updateConnection}
                        readOnly={readOnly}
                        hasMethod={hasRightMethod}
                        connector={connector}
                        param={condition.rightParam}
                        items={paramItems}
                        updateParam={::this.updateParam}
                        style={::this.getParamStyles()}
                        isMultiline={isMultiline}
                    />
                }
            </React.Fragment>
        );
    }
}

export default RightStatement;
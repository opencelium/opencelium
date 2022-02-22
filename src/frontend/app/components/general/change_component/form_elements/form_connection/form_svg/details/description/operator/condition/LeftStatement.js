import React from 'react';
import MethodSelect from "./MethodSelect";
import ParamInput from "./ParamInput";
import {DEFAULT_COLOR} from "@classes/components/content/connection/operator/CStatement";
import PropertyInput
    from "@change_component/form_elements/form_connection/form_svg/details/description/operator/condition/PropertyInput";

class LeftStatement extends React.Component{
    constructor(props) {
        super(props);
    }

    updateMethod(method){
        const {condition, updateCondition, getConditionFromProps} = this.props;
        updateCondition({
            ...condition,
            leftMethod: method,
            leftParam: getConditionFromProps().leftParam,
        });
    }

    updateParam(param){
        const {condition, updateCondition} = this.props;
        updateCondition({
            ...condition,
            leftParam: param,
        });
    }

    getMethodStyles(){
        const {isOperatorHasValue, isLoopOperator} = this.props;
        let {hasValue} = isOperatorHasValue();
        let width = hasValue ? '10%' : '20%';
        if(isLoopOperator){
            width = '30%';
        }
        return {width, padding: 0, float: 'left', transition: 'width 0.3s ease 0s',};
    }

    getParamStyles(){
        const {isOperatorHasThreeParams, isOperatorHasValue, isLoopOperator} = this.props;
        let {hasValue} = isOperatorHasValue();
        let width = hasValue ? isOperatorHasThreeParams ? '28%' : '35%' : '55%';
        if(isLoopOperator){
            width = '70%';
        }
        return {float: 'left', width, position: 'relative'};
    }

    render(){
        let {condition, connection, connector, operator, readOnly, isOperatorHasValue, hasLeftMethod, updateConnection} = this.props;
        let {hasValue} = isOperatorHasValue();
        let methodSource = connection.getOptionsForMethods(connector, operator, {statement: 'leftStatement', isKeyConsidered: false, exceptCurrent: false});
        if(methodSource.length === 0) {
            methodSource = [{label: 'No params', value: 0, color: 'white'}];
        }
        const methodPlaceholder = '...';
        const isMethodDisabled = readOnly;
        const isMethodSearchable = !readOnly;
        let paramItems = hasLeftMethod ? connection.getMethodByColor(condition.leftMethod.color).response.success : [];
        const paramId = `${connector.getConnectorType()}_if_operator_${operator.type}_${operator.index}`;
        return(
            <React.Fragment>
                <MethodSelect
                    readOnly={readOnly}
                    hasValue={hasValue}
                    method={condition.leftMethod}
                    source={methodSource}
                    updateMethod={::this.updateMethod}
                    style={::this.getMethodStyles()}
                    placeholder={methodPlaceholder}
                    isDisabled={isMethodDisabled}
                    isSearchable={isMethodSearchable}
                />
                <ParamInput
                    id={paramId}
                    updateConnection={updateConnection}
                    readOnly={readOnly}
                    hasMethod={hasLeftMethod}
                    connector={connector}
                    param={condition.leftParam}
                    items={paramItems}
                    updateParam={::this.updateParam}
                    style={::this.getParamStyles()}
                />
            </React.Fragment>
        );
    }
}

export default LeftStatement;
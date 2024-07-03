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
import MethodSelect from "./MethodSelect";
import ParamInput from "./ParamInput";

class LeftStatement extends React.Component{
    constructor(props) {
        super(props);
        this.methodSelectRef = React.createRef();
        this.paramInputRef = React.createRef();
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
        let width = hasValue ? '6%' : '16%';
        if(isLoopOperator){
            width = '26%';
        }
        return {width, padding: 0, float: 'left', transition: 'width 0.3s ease 0s',};
    }

    getParamStyles(){
        const {isOperatorHasThreeParams, isOperatorHasValue, isLoopOperator} = this.props;
        let {hasValue} = isOperatorHasValue();
        let width = hasValue ? isOperatorHasThreeParams ? '28%' : '35%' : '52%';
        if(isLoopOperator){
            width = '70%';
        }
        return {float: 'left', width};
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
                    ref={this.methodSelectRef}
                    readOnly={readOnly}
                    hasValue={hasValue}
                    method={condition.leftMethod}
                    source={methodSource}
                    updateMethod={(a) => this.updateMethod(a)}
                    style={this.getMethodStyles()}
                    placeholder={methodPlaceholder}
                    isDisabled={isMethodDisabled}
                    isSearchable={isMethodSearchable}
                    fromStatement="left"
                />
                <ParamInput
                    ref={this.paramInputRef}
                    id={paramId}
                    updateConnection={updateConnection}
                    selectedMethod={condition.leftMethod ? connection.getMethodByColor(condition.leftMethod.color) : null}
                    selectedConnector={condition.leftMethod ? connection.getConnectorByMethodColor(condition.leftMethod.color) : null}
                    connection={connection}
                    readOnly={readOnly}
                    hasMethod={hasLeftMethod}
                    connector={connector}
                    param={condition.leftParam}
                    items={paramItems}
                    updateParam={(a) => this.updateParam(a)}
                    style={this.getParamStyles()}
                    fromStatement="left"
                />
            </React.Fragment>
        );
    }
}

export default LeftStatement;

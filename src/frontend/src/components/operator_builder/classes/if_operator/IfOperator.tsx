import {GroupProps, OperatorType, RulePropertyProps, RuleUIProps} from "@app_component/operator_builder/props";
import {
    AllOperatorNames,
    OperatorName,
    UnaryOperatorName
} from "@app_component/operator_builder/interfaces/OperatorName";
import {generateUUID, getEnumKeyByValue, isBinaryOperator} from "@app_component/operator_builder/utils";
import ReferenceGenerator from "@app_component/operator_builder/reference_generator/ReferenceGenerator";
import React from "react";
import OperatorSelect from "@app_component/operator_builder/operator_select/OperatorSelect";
import ReferenceFactory from "@app_component/operator_builder/classes/references/ReferenceFactory";

export default class IfOperator {
    type = OperatorType.If;

    static getInitialTree(): GroupProps {
        return {
            id: generateUUID(),
            type: 'group',
            properties: {
                not: false,
            }
        };
    }
    static getExpressionFormat(ruleProps: RulePropertyProps): string {
        const {rightField, leftField, operator} = ruleProps;
        const operatorName = getEnumKeyByValue(AllOperatorNames,  operator);
        const isLeftFieldReference = leftField && !!(ReferenceFactory.createReferenceInstance(leftField));
        const isRightFieldReference = rightField && !!(ReferenceFactory.createReferenceInstance(rightField));
        const leftExpression = isLeftFieldReference ? leftField : `'${leftField}'`;
        const rightExpression = isRightFieldReference ? rightField : `'${rightField}'`;
        return rightField ? `${leftExpression} ${operatorName} ${rightExpression}` : `${leftExpression} ${operatorName}`;
    }

    static isExpressionNotValid(ruleProps: RulePropertyProps): boolean {
        const {operator, rightField, leftField} = ruleProps;
        return !leftField || !operator || (rightField === undefined && Object.values(UnaryOperatorName).indexOf(operator as UnaryOperatorName) !== -1);
    }

    static getRuleComponent(props: RuleUIProps): any {
        const {rule, updateRule, hasNext, builderProps} = props;
        return (
            <React.Fragment>
                <ReferenceGenerator builderProps={builderProps} reference={rule?.properties?.leftField || ''} setValue={(leftField) => {
                    updateRule({...rule, properties: {...rule?.properties, leftField, operator: '', rightField: ''}})
                }}/>
                {rule?.properties?.leftField &&
                    <React.Fragment>
                        <OperatorSelect
                            type={builderProps.type}
                            operator={rule?.properties?.operator || ''}
                            updateOperator={(operator) => {
                                updateRule({...rule, properties: {...rule?.properties, operator, rightField: ''}})
                            }}
                        />
                        {rule?.properties?.operator && isBinaryOperator(rule.properties.operator) &&
                            <ReferenceGenerator
                                builderProps={builderProps}
                                reference={rule?.properties?.rightField || ''}
                                setValue={(rightField) => {
                                    updateRule({...rule, properties: {...rule?.properties, rightField}})
                                }}
                            />
                        }
                    </React.Fragment>
                }
            </React.Fragment>
        )
    }
}

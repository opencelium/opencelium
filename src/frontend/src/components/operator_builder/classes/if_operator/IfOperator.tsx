import {GroupProps, OperatorType, RulePropertyProps, RuleUIProps} from "@app_component/operator_builder/props";
import {
    AllOperatorNames,
    BinaryOperatorName,
    UnaryOperatorName
} from "@app_component/operator_builder/interfaces/OperatorName";
import {generateUUID, getEnumKeyByValue, isBinaryOperator} from "@app_component/operator_builder/utils";
import ReferenceGenerator, {EmptyString} from "@app_component/operator_builder/reference_generator/ReferenceGenerator";
import React from "react";
import OperatorSelect from "@app_component/operator_builder/operator_select/OperatorSelect";
import ReferenceFactory from "@app_component/operator_builder/classes/references/ReferenceFactory";
import Like from "@app_component/operator_builder/classes/if_operator/types/Like";

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
        const isUnary = Object.values(UnaryOperatorName).indexOf(operator as UnaryOperatorName) !== -1
        const isLeftFieldReference = leftField && !!(ReferenceFactory.createReferenceInstance(leftField));
        const isRightFieldReference = rightField && !!(ReferenceFactory.createReferenceInstance(rightField));
        const leftExpression = isLeftFieldReference ? leftField : `'${leftField}'`;
        const rightExpression = isRightFieldReference ? rightField : rightField === EmptyString ? `''` : `'${rightField}'`;
        return rightField && !isUnary ? `${leftExpression} ${operatorName} ${rightExpression}` : `${leftExpression} ${operatorName}`;
    }

    static isExpressionNotValid(ruleProps: RulePropertyProps): boolean {
        const {operator, rightField, leftField} = ruleProps;
        return !leftField || !operator || (!rightField && Object.values(UnaryOperatorName).indexOf(operator as UnaryOperatorName) === -1);
    }

    static getRuleComponent(props: RuleUIProps): any {
        const {rule, updateRule, hasNext, connectionEditor} = props;
        let leftField = rule?.properties?.leftField;
        let rightField = rule?.properties?.rightField;
        const isLikeOperator = Like.isLikeOperator(rule.properties?.operator);
        if (isLikeOperator) {
            const leftFieldWithoutQuotes = leftField.startsWith('"') && leftField.endsWith('"') ? leftField.substring(1, leftField.length - 1) : leftField;
            if (leftField !== leftFieldWithoutQuotes) {
                if (!!(ReferenceFactory.createReferenceInstance(leftFieldWithoutQuotes))){
                    leftField = leftFieldWithoutQuotes;
                }
            }
            const rightFieldWithoutQuotes = rightField.startsWith('"') && rightField.endsWith('"') ? rightField.substring(1, rightField.length - 1) : rightField;
            if (rightField !== rightFieldWithoutQuotes) {
                if (!!(ReferenceFactory.createReferenceInstance(rightFieldWithoutQuotes))){
                    rightField = rightFieldWithoutQuotes;
                }
            }
        }
        return (
            <React.Fragment>
                <ReferenceGenerator error={rule.error} isBuilder connectionEditor={connectionEditor} reference={leftField || ''} setReference={(leftField: string) => {
                        if (isLikeOperator && !!(ReferenceFactory.createReferenceInstance(leftField))) {
                            leftField = `"${leftField}"`;
                        }
                        updateRule({...rule, error: '', properties: {...rule?.properties, leftField, operator: '', rightField: EmptyString}})
                }}/>
                {leftField &&
                    <React.Fragment>
                        <OperatorSelect
                            error={rule.error}
                            type={OperatorType.If}
                            operator={rule?.properties?.operator || ''}
                            updateOperator={(operator) => {
                                updateRule({...rule, error: '', properties: {...rule?.properties, operator, rightField: EmptyString}})
                            }}
                        />
                        {rule?.properties?.operator && isBinaryOperator(rule.properties.operator) &&
                            <ReferenceGenerator
                                isBuilder
                                error={rule.error}
                                operator={rule.properties?.operator || ''}
                                connectionEditor={connectionEditor}
                                reference={rightField || ''}
                                setReference={(rightField: string) => {
                                    if (isLikeOperator && !!(ReferenceFactory.createReferenceInstance(rightField))) {
                                        rightField = `"${rightField}"`;
                                    }
                                    updateRule({...rule, error: '', properties: {...rule?.properties, rightField}})
                                }}
                            />
                        }
                    </React.Fragment>
                }
            </React.Fragment>
        )
    }
}

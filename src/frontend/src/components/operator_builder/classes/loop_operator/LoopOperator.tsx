import {GroupProps, OperatorType, RulePropertyProps, RuleUIProps} from "@app_component/operator_builder/props";
import {LoopOperatorName} from "@app_component/operator_builder/interfaces/OperatorName";
import {generateUUID, getEnumKeyByValue} from "@app_component/operator_builder/utils";
import React from "react";
import ReferenceGenerator from "@app_component/operator_builder/reference_generator/ReferenceGenerator";
import OperatorSelect from "@app_component/operator_builder/operator_select/OperatorSelect";
import ReferenceFactory from "@app_component/operator_builder/classes/references/ReferenceFactory";

export default class LoopOperator {
    type = OperatorType.Loop;
    static getInitialTree(): GroupProps {
        return {
            id: generateUUID(),
            type: 'group',
            properties: {
                not: false,
            },
            items: [
                {
                    id: generateUUID(),
                    type: "rule"
                }
            ]
        };
    }
    static getExpressionFormat(ruleProps: RulePropertyProps): string {
        const {rightField, leftField, operator} = ruleProps;
        const operatorName = getEnumKeyByValue(LoopOperatorName, operator);
        const isLeftFieldReference = leftField && !!(ReferenceFactory.createReferenceInstance(leftField));
        const isRightFieldReference = rightField && !!(ReferenceFactory.createReferenceInstance(rightField));
        const leftExpression = isLeftFieldReference ? leftField : `'${leftField}'`;
        const rightExpression = isRightFieldReference ? rightField : `'${rightField}'`;
        if (operator === LoopOperatorName.SplitString) {
            return rightField ? `${leftExpression} ${operatorName} ${rightExpression}` : `${leftExpression} ${operatorName}`;
        } else {
            return rightField ? `${operatorName} ${leftExpression} ${rightExpression}` : `${operatorName} ${leftExpression}`;
        }
    }

    static isExpressionNotValid(ruleProps: RulePropertyProps): boolean {
        const {operator, rightField, leftField} = ruleProps;
        return !operator || !leftField || (operator === LoopOperatorName.SplitString && !rightField);
    }

    static getRuleComponent(props: RuleUIProps): any {
        const {rule, updateRule, hasNext, connectionEditor} = props;
        return (
            <div style={{display: 'flex', justifyContent: 'left', width: '100%'}}>
                <OperatorSelect
                    type={OperatorType.Loop}
                    operator={rule?.properties?.operator || ''}
                    updateOperator={(operator) => {
                        updateRule({...rule, properties: {...rule?.properties, operator, leftField: '', rightField: ''}})
                    }}
                />
                {rule?.properties?.operator && <React.Fragment>
                    <ReferenceGenerator isBuilder style={{marginLeft: '10px'}} connectionEditor={connectionEditor} reference={rule?.properties?.leftField || ''} setReference={(leftField: string) => {
                        updateRule({...rule, properties: {...rule?.properties, leftField, rightField: ''}})
                    }}/>
                    {rule?.properties?.leftField &&
                        <React.Fragment>
                            {rule?.properties?.operator === LoopOperatorName.SplitString &&
                                <ReferenceGenerator
                                    style={{marginLeft: '10px'}}
                                    connectionEditor={connectionEditor}
                                    reference={rule?.properties?.rightField || ''}
                                    setReference={(rightField: string) => {
                                        updateRule({...rule, properties: {...rule?.properties, rightField}})
                                    }}
                                    isBuilder
                                />
                            }
                        </React.Fragment>
                    }
                </React.Fragment>
                }
            </div>
        )
    }
}

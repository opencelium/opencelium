import {GroupProps, OperatorType, RulePropertyProps, RuleUIProps} from "@app_component/operator_builder/props";
import {LoopOperatorName} from "@app_component/operator_builder/interfaces/OperatorName";
import {generateUUID, getEnumKeyByValue} from "@app_component/operator_builder/utils";
import React from "react";
import ReferenceGenerator from "@app_component/operator_builder/reference_generator/ReferenceGenerator";
import OperatorSelect from "@app_component/operator_builder/operator_select/OperatorSelect";

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
        if (operator === LoopOperatorName.SplitString) {
            return rightField ? `'${leftField}' ${operatorName} '${rightField}'` : `'${leftField}' ${operatorName}`;
        } else {
            return rightField ? `${operatorName} '${leftField}' '${rightField}'` : `${operatorName} '${leftField}'`;
        }
    }

    static isExpressionNotValid(ruleProps: RulePropertyProps): boolean {
        const {operator, rightField, leftField} = ruleProps;
        return !operator || !leftField || (operator === LoopOperatorName.SplitString && !rightField);
    }

    static getRuleComponent(props: RuleUIProps): any {
        const {rule, updateRule, hasNext, builderProps} = props;
        return (
            <React.Fragment>
                <OperatorSelect
                    type={props.builderProps.type}
                    operator={rule?.properties?.operator || ''}
                    updateOperator={(operator) => {
                        updateRule({...rule, properties: {...rule?.properties, operator, leftField: '', rightField: ''}})
                    }}
                />
                {rule?.properties?.operator && <React.Fragment>
                    <ReferenceGenerator builderProps={builderProps} reference={rule?.properties?.leftField || ''} setValue={(leftField) => {
                        updateRule({...rule, properties: {...rule?.properties, leftField, rightField: ''}})
                    }}/>
                    {rule?.properties?.leftField &&
                        <React.Fragment>
                            {rule?.properties?.operator === LoopOperatorName.SplitString &&
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
                }
            </React.Fragment>
        )
    }
}

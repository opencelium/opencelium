import React from 'react';
import ReferenceGenerator from './reference_generator/ReferenceGenerator'
import {RuleUIProps} from './props'
import OperatorSelect from "./operator_select/OperatorSelect";
import {RuleContainer} from "@app_component/operator_builder/styles";
import {isBinaryOperator} from "@app_component/operator_builder/utils";

const Rule = ({rule, updateRule, hasNext, builderProps}: RuleUIProps) => {
    return (
        <RuleContainer hasNext={hasNext}>
            <ReferenceGenerator builderProps={builderProps} reference={rule?.properties?.leftField || ''} setValue={(leftField) => {
                updateRule({...rule, properties: {...rule?.properties, leftField, operator: '', rightField: ''}})
            }}/>
            {rule?.properties?.leftField &&
                <React.Fragment>
                    <OperatorSelect
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
        </RuleContainer>
    )
}
export default Rule;

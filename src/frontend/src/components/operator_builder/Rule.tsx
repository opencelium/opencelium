import React, {useState} from 'react';
import ReferenceGenerator from './reference_generator/ReferenceGenerator'
import {RuleUIProps} from './props'
import OperatorSelect from "./operator_select/OperatorSelect";
import {DeleteButton, DeleteButtonContainer, RuleContainer} from "@app_component/operator_builder/styles";
import {isBinaryOperator} from "@app_component/operator_builder/utils";

const Rule = ({rule, updateRule, deleteRule, hasNext, builderProps}: RuleUIProps) => {
    const [showActions, toggleActions] = useState<boolean>(false);
    const onMouseOver = () => {
        if (!showActions){
            toggleActions(true);
        }
    }
    const onMouseLeave = () => {
        if (showActions){
            toggleActions(false);
        }
    }
    return (
        <RuleContainer hasNext={hasNext} onMouseOver={onMouseOver} onMouseLeave={onMouseLeave}>
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
            {showActions &&
                <DeleteButtonContainer>
                    <DeleteButton icon={'delete'} tooltip={'Delete'} target={`delete_${rule.id}`} handleClick={() => deleteRule(rule.id)} hasBackground={false}/>
                </DeleteButtonContainer>
            }
        </RuleContainer>
    )
}
export default Rule;

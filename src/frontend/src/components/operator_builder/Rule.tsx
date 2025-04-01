import React, {useState} from 'react';
import {OperatorType, RuleUIProps} from './props'
import {DeleteButton, DeleteButtonContainer, RuleContainer} from "@app_component/operator_builder/styles";
import OperatorTypeFactory from "@app_component/operator_builder/classes/OperatorTypeFactory";

const Rule = (props: RuleUIProps) => {
    const {rule, deleteRule, hasNext, type} = props;
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
    const ruleComponent = (new OperatorTypeFactory(type)).getRuleComponent(props);
    return (
        <RuleContainer isLoop={type === OperatorType.Loop} hasNext={hasNext} onMouseOver={onMouseOver} onMouseLeave={onMouseLeave}>
            {ruleComponent}
            {showActions && type === OperatorType.If &&
                <DeleteButtonContainer>
                    <DeleteButton icon={'delete'} tooltip={'Delete'} target={`delete_${rule.id}`} handleClick={() => deleteRule(rule.id)} hasBackground={false}/>
                </DeleteButtonContainer>
            }
        </RuleContainer>
    )
}
export default Rule;

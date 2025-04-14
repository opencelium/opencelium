import React, {useState} from 'react';
import {OperatorType, RuleUIProps} from './props'
import {DeleteButton, DeleteButtonContainer, ErrorMessage, RuleContainer} from "@app_component/operator_builder/styles";
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
    const isLoop = type === OperatorType.Loop;
    return (
        <RuleContainer isLoop={isLoop} hasNext={hasNext} onMouseOver={onMouseOver} onMouseLeave={onMouseLeave}>
            {ruleComponent}
            {showActions && type === OperatorType.If &&
                <DeleteButtonContainer>
                    <DeleteButton icon={'delete'} tooltip={'Delete'} target={`delete_${rule.id}`} handleClick={() => deleteRule(rule.id)} hasBackground={false}/>
                </DeleteButtonContainer>
            }
            {!!rule.error && <ErrorMessage style={{position: 'absolute', bottom: isLoop ? '-35px' : '-20px', left: isLoop ? 0 : '50px'}}>{`${rule.error}`}</ErrorMessage>}
        </RuleContainer>
    )
}
export default Rule;

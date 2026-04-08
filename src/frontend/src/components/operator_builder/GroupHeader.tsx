import React, {useEffect, useState} from 'react';
import {Conjunction, GroupHeaderUIProps, GroupProps} from "@app_component/operator_builder/props";
import {generateUUID} from "@app_component/operator_builder/utils";
import {
    ActionButton,
    ActionsContainer,
    ConjunctionAndButton,
    ConjunctionContainer,
    ConjunctionOrButton, DeleteButton,
    GroupHeaderContainer, GroupHeaderErrorContainer
} from "@app_component/operator_builder/styles";
import {ErrorColor} from "@app_component/operator_builder/OperatorBuilder";

const GroupHeader = ({updateGroup, deleteGroup, group, isInitial}: GroupHeaderUIProps) => {
    const [showActions, toggleActions] = useState<boolean>(true);
    const unselectedStyles = {
        backgroundColor: '#aaa',
        color: 'black',
        borderColor: '#aaa',
    }
    const isAnd = group?.properties?.conjunction === Conjunction.AND;
    const isOr = group?.properties?.conjunction === Conjunction.OR;
    useEffect(() => {
        if (group?.items) {
            if (group?.items?.length <= 1) {
                updateGroup(prev => ({
                    ...prev,
                    properties: {
                        ...prev.properties,
                        conjunction: undefined,
                    },
                }))
            }
        }
    }, [group?.items]);
    const addRule = () => {
        const items = group?.items || [];
        updateGroup(prev => ({
            ...prev,
            error: '',
            items: [
                ...(prev.items || []),
                {
                    id: generateUUID(),
                    type: 'rule'
                }
            ]
        }))
    }
    const addGroup = () => {
        const items = group?.items || [];
        updateGroup(prev => ({
            ...prev,
            error: '',
            items: [
                ...(prev.items || []),
                {
                    id: generateUUID(),
                    type: 'group',
                    properties: {
                        conjunction: undefined,
                    },
                }
            ],
        }))
    }
    const setConjunction = (conjunction: Conjunction) => {
        updateGroup(prev => ({
            ...prev,
            error: '',
            properties: {
                ...prev.properties,
                conjunction:
                    prev.properties.conjunction === conjunction
                        ? undefined
                        : conjunction,
            },
        }))
    }
    const onMouseOver = () => {
        if (!showActions){
            //toggleActions(true);
        }
    }
    const onMouseLeave = () => {
        if (showActions){
            //toggleActions(false);
        }
    }
    const hasItems = group?.items?.length > 0;
    const conjunctionAndStyle: any = isAnd ? {} : unselectedStyles;
    const conjunctionOrStyle: any = isOr ? {} : unselectedStyles;
    const isConjunctionDisabled = !group.items || group?.items?.length <= 1;
    if (isConjunctionDisabled) {
        conjunctionAndStyle.backgroundColor = '#d2d0ca';
        conjunctionOrStyle.backgroundColor = '#d2d0ca';
    }
    if (!!group.error) {
        conjunctionAndStyle.backgroundColor = ErrorColor;
        conjunctionOrStyle.backgroundColor = ErrorColor;
    }
    return (
        <GroupHeaderContainer hasItems={hasItems || false} onMouseOver={onMouseOver} onMouseLeave={onMouseLeave}>
            <ConjunctionContainer>
                <ConjunctionAndButton label={'AND'} style={conjunctionAndStyle} isDisabled={isConjunctionDisabled} handleClick={() => setConjunction(Conjunction.AND)}/>
                <ConjunctionOrButton label={'OR'} style={conjunctionOrStyle} isDisabled={isConjunctionDisabled} handleClick={() => setConjunction(Conjunction.OR)}/>
            </ConjunctionContainer>
            {!!group.error && <GroupHeaderErrorContainer className={'error-scroll-target'} style={{color: ErrorColor}}>{group.error}</GroupHeaderErrorContainer>}
            {showActions && <ActionsContainer>
                <ActionButton label={'Add Condition'} handleClick={addRule}/>
                <ActionButton label={'Add Group'} handleClick={addGroup}/>
                {deleteGroup && <DeleteButton icon={'delete'} tooltip={'Delete'} target={`delete_${group.id}`} handleClick={() => deleteGroup(group.id)} hasBackground={false}/>}
            </ActionsContainer>}
        </GroupHeaderContainer>
    )
}

export default GroupHeader;

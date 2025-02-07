import React, {useState} from 'react';
import {Conjunction, GroupHeaderUIProps} from "@app_component/operator_builder/props";
import {generateUUID} from "@app_component/operator_builder/utils";
import {
    ActionButton,
    ActionsContainer,
    ConjunctionAndButton,
    ConjunctionContainer,
    ConjunctionOrButton, DeleteButton,
    GroupHeaderContainer
} from "@app_component/operator_builder/styles";

const GroupHeader = ({updateGroup, deleteGroup, group}: GroupHeaderUIProps) => {
    const [showActions, toggleActions] = useState<boolean>(false);
    const unselectedStyles = {
        backgroundColor: '#aaa',
        color: 'black',
        borderColor: '#aaa',
    }
    const isAnd = group?.properties?.conjunction === Conjunction.AND;
    const isOr = group?.properties?.conjunction === Conjunction.OR;
    const addRule = () => {
        const items = group?.items || [];
        updateGroup({
            ...group,
            items: [
                ...items,
                {
                    id: generateUUID(),
                    type: 'rule'
                }
            ]
        })
    }
    const addGroup = () => {
        const items = group?.items || [];
        updateGroup({
            ...group,
            items: [
                ...items,
                {
                    id: generateUUID(),
                    type: 'group',
                    properties: {
                        conjunction: Conjunction.AND,
                    },
                }
            ],
        })
    }
    const setConjunction = (conjunction: Conjunction) => {
        updateGroup({
            ...group,
            properties: {
                ...group.properties,
                conjunction: group.properties.conjunction === conjunction ? undefined : conjunction,
            }
        })
    }
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
        <GroupHeaderContainer hasItems={group?.items?.length > 0 || false} onMouseOver={onMouseOver} onMouseLeave={onMouseLeave}>
            <ConjunctionContainer>
                <ConjunctionAndButton label={'AND'} style={isAnd ? {} : unselectedStyles} handleClick={() => setConjunction(Conjunction.AND)}/>
                <ConjunctionOrButton label={'OR'} style={isOr ? {} : unselectedStyles} handleClick={() => setConjunction(Conjunction.OR)}/>
            </ConjunctionContainer>
            {showActions && <ActionsContainer>
                <ActionButton label={'Add Rule'} handleClick={addRule}/>
                <ActionButton label={'Add Group'} handleClick={addGroup}/>
                {deleteGroup && <DeleteButton icon={'delete'} tooltip={'Delete'} target={`delete_${group.id}`} handleClick={() => deleteGroup(group.id)} hasBackground={false}/>}
            </ActionsContainer>}
        </GroupHeaderContainer>
    )
}

export default GroupHeader;

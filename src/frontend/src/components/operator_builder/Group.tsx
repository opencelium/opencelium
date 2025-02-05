import React from 'react';
import {
    GroupContainer,
    GroupItemsContainer
} from "./styles";
import {GroupUIProps} from './props';
import GroupHeader from "@app_component/operator_builder/GroupHeader";
import Rule from "@app_component/operator_builder/Rule";

const Group = ({updateGroup, deleteGroup, group, isInitial, hasNext, builderProps}: GroupUIProps) => {
    return (
        <GroupContainer isInitial={isInitial} hasNext={hasNext}>
            <GroupHeader group={group} updateGroup={updateGroup} deleteGroup={deleteGroup}/>
            {group?.items?.length > 0 && <GroupItemsContainer>
                {
                    group?.items.map((item, index) => {
                        switch (item.type){
                            case "group":
                                return <Group
                                    key={item.id}
                                    builderProps={builderProps}
                                    hasNext={index !== group.items.length - 1}
                                    updateGroup={(newGroup) => {
                                        updateGroup({
                                            ...group,
                                            items: group.items.map(i => {
                                                return i.id === item.id ? {...newGroup} : i;
                                            })
                                        })
                                    }}
                                    deleteGroup={(groupId) => {
                                        updateGroup({
                                            ...group,
                                            items: group.items.filter(i => {
                                                return i.id !== groupId;
                                            })
                                        })
                                    }}
                                    group={item}
                                />;
                            case "rule":
                                return <Rule
                                    key={item.id}
                                    builderProps={builderProps}
                                    hasNext={index !== group.items.length - 1}
                                    rule={item}
                                    updateRule={(newRule) => {
                                        updateGroup({
                                            ...group,
                                            items: group.items.map((i) => {
                                                return i.id === item.id ? {...newRule} : i;
                                            })
                                        })
                                    }}
                                    deleteRule={(ruleId) => {
                                        updateGroup({
                                            ...group,
                                            items: group.items.filter((i) => {
                                                return i.id !== ruleId;
                                            })
                                        })
                                    }}
                                />;
                        }
                    })
                }
            </GroupItemsContainer>
            }
        </GroupContainer>
    )
}

export default Group;

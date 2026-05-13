import React from 'react';
import {GroupItemsContainer, IfGroupContainer, LoopGroupContainer} from "./styles";
import {GroupProps, GroupUIProps, OperatorType} from './props';
import GroupHeader from "@app_component/operator_builder/GroupHeader";
import Rule from "@app_component/operator_builder/Rule";

const Group = ({updateGroup, deleteGroup, group, isInitial, hasNext, connectionEditor, type}: GroupUIProps) => {
    const GroupComponent = type === OperatorType.Loop ? LoopGroupContainer : IfGroupContainer;
    return (
        <GroupComponent isInitial={isInitial} hasNext={hasNext}>
            {type === OperatorType.If && <GroupHeader isInitial={isInitial} group={group} updateGroup={updateGroup} deleteGroup={deleteGroup}/>}
            {group?.items?.length > 0 && <GroupItemsContainer isLoop={type === OperatorType.Loop}>
                {
                    group?.items.map((item, index) => {
                        switch (item.type){
                            case "group":
                                return <Group
                                    key={item.id}
                                    type={type}
                                    connectionEditor={connectionEditor}
                                    hasNext={index !== group.items.length - 1}
                                    updateGroup={(updater) => {
                                        updateGroup((prevGroup) => ({
                                            ...prevGroup,
                                            items: prevGroup.items.map(i => {
                                                if (i.id !== item.id) return i;

                                                const current = i as GroupProps;

                                                return typeof updater === 'function'
                                                    ? updater(current)
                                                    : updater;
                                            })
                                        }));
                                    }}
                                    deleteGroup={(groupId) => {
                                        updateGroup((prevGroup: GroupProps) => ({
                                            ...prevGroup,
                                            items: prevGroup.items.filter(i => i.id !== groupId),
                                            error: '',
                                        }))
                                    }}
                                    group={item}
                                />;
                            case "rule":
                                return <Rule
                                    key={item.id}
                                    type={type}
                                    connectionEditor={connectionEditor}
                                    hasNext={index !== group.items.length - 1}
                                    rule={item}
                                    updateRule={(updater) => {
                                        updateGroup((prevGroup: GroupProps) => ({
                                            ...prevGroup,
                                            items: prevGroup.items.map((i) => {
                                                if (i.id !== item.id || i.type !== 'rule') return i;

                                                return typeof updater === 'function'
                                                    ? updater(i)
                                                    : updater;
                                            })
                                        }));
                                    }}
                                    deleteRule={(ruleId) => {
                                        updateGroup((prevGroup: GroupProps) => ({
                                            ...prevGroup,
                                            items: prevGroup.items.filter(i => i.id !== ruleId),
                                            error: '',
                                        }))
                                    }}
                                />;
                        }
                    })
                }
            </GroupItemsContainer>
            }
        </GroupComponent>
    )
}

export default Group;

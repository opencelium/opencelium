import {LoopOperatorName, OperatorName} from "./interfaces/OperatorName";
import CConnection from "@classes/content/connection/CConnection";
import CConnectorItem from "@classes/content/connection/CConnectorItem";
import COperatorItem from "@classes/content/connection/operator/COperatorItem";
import CMethodItem from "@classes/content/connection/method/CMethodItem";

export interface RulePropertyProps {
    leftField: string,
    operator: OperatorName | LoopOperatorName | '',
    rightField?: string,
}
export enum Conjunction {
    AND= '&&',
    OR= '||',
}
export interface GroupPropertyProps {
    conjunction?: Conjunction,
    not?: boolean,
}
export interface RuleProps {
    id: string,
    type: 'rule',
    properties?: RulePropertyProps,
}
export interface RuleUIProps extends UpdateRuleProps, Omit<RuleStyleProps, "isLoop">{
    rule: RuleProps,
    builderProps: ConnectionEditorProps
}
export interface RuleStyleProps {
    hasNext: boolean,
    isLoop: boolean,
}
export interface UpdateRuleProps {
    updateRule: (newRule: RuleProps) => void,
    deleteRule: (ruleId: string) => void,
}
export enum OperatorType {
    Loop= 'loop',
    If= 'if'
}
export interface ConnectionEditorProps {
    connection: CConnection,
    connector: CConnectorItem,
    item: COperatorItem | CMethodItem,
    updateConnection: any,
    type: OperatorType,

}
export interface GroupProps {
    id: string,
    type: 'group',
    properties?: GroupPropertyProps,
    items?: ChildProps[],
}
export interface GroupHeaderStyleProps {
    hasItems?: boolean,
}
export type ChildProps = RuleProps | GroupProps;
export interface GroupUIProps extends UpdateGroupProps, GroupStyleProps{
    group: GroupProps,
    builderProps: ConnectionEditorProps
}
export interface GroupHeaderUIProps extends UpdateGroupProps{
    group: GroupProps,
}
export interface GroupStyleProps {
    isInitial?: boolean,
    hasNext: boolean,
}
export interface UpdateGroupProps {
    updateGroup: (newGroup: GroupProps) => void;
    deleteGroup?: (groupId: string) => void,
}

export interface OperatorSelectProps {
    type: OperatorType,
    operator: OperatorName | LoopOperatorName | '',
    updateOperator: (newOperatorName: OperatorName | '') => void,
}

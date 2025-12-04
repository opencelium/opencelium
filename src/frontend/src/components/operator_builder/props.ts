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
    error?: string,
    properties?: RulePropertyProps,
}
export interface RuleUIProps extends UpdateRuleProps, Omit<RuleStyleProps, "isLoop">{
    rule: RuleProps,
    connectionEditor: ConnectionEditorProps,
    type: OperatorType,
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

}
export interface OperatorBuilderProps extends ConnectionEditorProps {
    type: OperatorType,
}
export interface GroupProps {
    id: string,
    type: 'group',
    error?: string,
    properties?: GroupPropertyProps,
    items?: ChildProps[],
}
export type ChildProps = RuleProps | GroupProps;
export interface GroupHeaderStyleProps {
    hasItems?: boolean,
}
export interface GroupUIProps extends UpdateGroupProps, GroupStyleProps{
    group: GroupProps,
    connectionEditor: ConnectionEditorProps
    type: OperatorType,
}
export interface GroupHeaderUIProps extends UpdateGroupProps{
    group: GroupProps,
    isInitial?: boolean,
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
    error?: string,
}
export type ValidationResult<T extends GroupProps | RuleProps> = {
    node: T;
    isValid: boolean;
};

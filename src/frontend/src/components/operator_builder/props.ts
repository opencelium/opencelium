import {OperatorName} from "./interfaces/OperatorName";
import CConnection from "@classes/content/connection/CConnection";
import CConnectorItem from "@classes/content/connection/CConnectorItem";
import COperatorItem from "@classes/content/connection/operator/COperatorItem";

export interface RulePropertyProps {
    leftField: string,
    operator: OperatorName | '',
    rightField?: string,
}
export enum Conjunction {
    AND= '&&',
    OR= '||',
}
export interface GroupPropertyProps {
    conjunction: Conjunction,
    not?: boolean,
}
export interface RuleProps {
    id: string,
    type: 'rule',
    properties?: RulePropertyProps,
}
export interface RuleUIProps extends UpdateRuleProps, RuleStyleProps{
    rule: RuleProps,
    builderProps: OperatorBuilderProps
}
export interface RuleStyleProps {
    hasNext: boolean,
}
export interface UpdateRuleProps {
    updateRule: (newRule: RuleProps) => void,
}
export interface OperatorBuilderProps {
    connection: CConnection,
    connector: CConnectorItem,
    operator: COperatorItem,
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
    builderProps: OperatorBuilderProps
}
export interface GroupHeaderUIProps {
    group: GroupProps,
    updateGroup: (newGroup: GroupProps) => void;
}
export interface GroupStyleProps {
    isInitial?: boolean,
    hasNext: boolean,
}
export interface UpdateGroupProps {
    updateGroup: (newGroup: GroupProps) => void;
}

export interface OperatorSelectProps {
    operator: OperatorName | '',
    updateOperator: (newOperatorName: OperatorName | '') => void,
}

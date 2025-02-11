
export interface RuleBaseModel {
    type: 'regex' | 'JSONPath' | 'XPath',
    expression: string,
}
export interface RuleRecordModel extends RuleBaseModel{
    ruleId: string,
}

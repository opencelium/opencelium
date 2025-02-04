export enum UnaryOperatorName {
    IsEmpty= 'is_empty',
    IsNotEmpty= 'is_not_empty',
    IsNotNull= 'is_not_null',
    IsNull= 'is_null',
}

export enum BinaryOperatorName {
    Contains= 'contains',
    ContainsSubStr= 'contains_substr',
    AllowList= 'allow_list',
    DenyList= 'deny_list',
    Equal= 'equal',
    IsTypeOf= 'is_type_off',
    NotContains= 'not_contains',
    NotContainsSubStr= 'not_contains_substr',
    Like= 'like',
    NotLike= 'not_like',
    Matches= 'matches',
    PropertyExists= 'property_exists',
    PropertyNotExists= 'property_not_exists',
    RegEx= 'reg_ex',
}

export const AllOperatorNames = {
    ...UnaryOperatorName,
    ...BinaryOperatorName,
} as const;
export type OperatorName = UnaryOperatorName | BinaryOperatorName;

export const OperatorLabel: {[name in OperatorName]: string} = {
    [BinaryOperatorName.AllowList]: 'Allow List',
    [BinaryOperatorName.DenyList]: 'Deny List',
    [BinaryOperatorName.Contains]: 'Contains',
    [BinaryOperatorName.NotContains]: 'Not Contains',
    [BinaryOperatorName.ContainsSubStr]: 'Contains Substring',
    [BinaryOperatorName.NotContainsSubStr]: 'Not Contains Substring',
    [BinaryOperatorName.PropertyExists]: 'Property Exists',
    [BinaryOperatorName.PropertyNotExists]: 'Property Not Exists',
    [BinaryOperatorName.Like]: 'Like',
    [BinaryOperatorName.NotLike]: 'Not Like',
    [BinaryOperatorName.IsTypeOf]: 'Is Type Of',
    [BinaryOperatorName.Matches]: 'Matches',
    [BinaryOperatorName.RegEx]: 'Reg Exp',
    [BinaryOperatorName.Equal]: 'Equal',

    [UnaryOperatorName.IsEmpty]: 'Is Empty',
    [UnaryOperatorName.IsNotEmpty]: 'Is Not Empty',
    [UnaryOperatorName.IsNull]: 'Is Null',
    [UnaryOperatorName.IsNotNull]: 'Is Not Null'
}

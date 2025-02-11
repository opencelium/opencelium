export enum LoopOperatorName {
    For= 'For',
    ForIn= 'ForIn',
    SplitString= 'SplitString',
}
export enum UnaryOperatorName {
    IsEmpty= 'IsEmpty',
    NotEmpty= 'NotEmpty',
    NotNull= 'NotNull',
    IsNull= 'IsNull',
}

export enum BinaryOperatorName {
    Contains= 'Contains',
    ContainsSubStr= 'ContainsSubStr',
    AllowList= 'AllowList',
    DenyList= 'DenyList',
    Equal= 'Equal',
    IsTypeOf= 'IsTypeOf',
    NotContains= 'NotContains',
    NotContainsSubStr= 'NotContainsSubStr',
    Like= 'Like',
    NotLike= 'NotLike',
    Matches= 'Matches',
    PropertyExists= 'PropertyExists',
    PropertyNotExists= 'PropertyNotExists',
    RegEx= 'RegEx',
}

export const AllOperatorNames = {
    ...UnaryOperatorName,
    ...BinaryOperatorName,
} as const;
export type OperatorName = UnaryOperatorName | BinaryOperatorName;

export const LoopOperatorLabel: {[name in LoopOperatorName]: string} = {
    [LoopOperatorName.For]: 'For',
    [LoopOperatorName.ForIn]: 'ForIn',
    [LoopOperatorName.SplitString]: 'SplitString',
}
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
    [UnaryOperatorName.NotEmpty]: 'Is Not Empty',
    [UnaryOperatorName.IsNull]: 'Is Null',
    [UnaryOperatorName.NotNull]: 'Is Not Null'
}

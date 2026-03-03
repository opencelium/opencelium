import {Step} from "react-joyride";
import React, {ReactNode} from "react";
import {
    BinaryOperatorName, LoopOperatorLabel, LoopOperatorName, OperatorLabel,
    OperatorName,
    UnaryOperatorName
} from "@app_component/operator_builder/interfaces/OperatorName";

export const LoopOperatorTourContents: {[name in LoopOperatorName]: ReactNode} = {
    [LoopOperatorName.For]: 'Unary operator: iterates over each element of an array. The operator processes every item in the selected array reference.',
    [LoopOperatorName.ForIn]: 'Unary operator: iterates over each character of a string. The operator processes the string symbol by symbol.',
    [LoopOperatorName.SplitString]: 'Splits a string using the specified delimiter and iterates over the resulting parts. The right value defines the separator.',
}

export const IfOperatorTourContents: {[name in OperatorName]: ReactNode} = {
    [BinaryOperatorName.AllowList]: `Returns true if the value exists in the defined allowed list.`,
    [BinaryOperatorName.DenyList]: `Returns true if the value exists in the defined denied list.`,
    [BinaryOperatorName.Contains]: `Checks whether the left value contains the right value.
Left: string or array of strings.
Right: string or array of strings.`,
    [BinaryOperatorName.NotContains]: `Returns true if the left value does not contain the right value.`,
    [BinaryOperatorName.ContainsSubStr]: `Checks whether the left string contains the right substring.
Works with string values.`,
    [BinaryOperatorName.NotContainsSubStr]: `Returns true if the left string does not contain the specified substring.`,
    [BinaryOperatorName.PropertyExists]: `Checks whether the specified property exists in the object.
Left: object
Right: string (property name)`,
    [BinaryOperatorName.PropertyNotExists]: `Returns true if the specified property does not exist in the object.
Left: object
Right: string (property name)`,
    [BinaryOperatorName.Like]: `Checks whether the value matches a pattern using wildcard rules.`,
    [BinaryOperatorName.NotLike]: `Returns true if the value does not match the specified pattern.`,
    [BinaryOperatorName.IsTypeOf]: `Checks whether the value matches the specified type (Number, Array, Object, String, Boolean).`,
    [BinaryOperatorName.RegEx]: `Matches the left string against a regular expression pattern.`,
    [BinaryOperatorName.Equal]: `Checks whether the left value equals the right value.
Supports number and string types.`,
    [BinaryOperatorName.NotEqual]: `Checks whether the left value is not equal to the right value.
Supports number and string comparison.`,
    [BinaryOperatorName.GreaterThan]: `Checks whether the left value is greater than the right value.
Supports number and string types.`,
    [BinaryOperatorName.GreaterThanOrEqualTo]: `Checks whether the left value is greater than or equal to the right value.
Supports number and string types.`,
    [BinaryOperatorName.LessThan]: `Checks whether the left value is less than the right value.
Used for numeric comparison.`,
    [BinaryOperatorName.LessThanOrEqualTo]: `Checks whether the left value is less than or equal to the right value.
Supports number and string types.`,

    [UnaryOperatorName.IsEmpty]: `Unary operator: returns true if the value is empty (empty string, empty array, or empty object).`,
    [UnaryOperatorName.NotEmpty]: `Unary operator: returns true if the value is not empty.`,
    [UnaryOperatorName.IsNull]: `Unary operator: returns true if the value is null.`,
    [UnaryOperatorName.NotNull]: `Unary operator: returns true if the value is not null.`,

}

export function getLoopOperatorTours (name: LoopOperatorName): Step[] {
    return [
        {
            title: LoopOperatorLabel[name],
            content: LoopOperatorTourContents[name],
            target: '',
            placement: 'bottom',
            disableBeacon: true,
            hideCloseButton: true,
            hideFooter: true,
        }
    ]
}


export function getIfOperatorTours (name: OperatorName): Step[] {
    return [
        {
            title: OperatorLabel[name],
            content: IfOperatorTourContents[name],
            target: '',
            placement: 'bottom',
            disableBeacon: true,
            hideCloseButton: true,
            hideFooter: true,
        }
    ]
}

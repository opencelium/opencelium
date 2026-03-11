import {Step} from "react-joyride";
import React, {ReactNode} from "react";
import {
    BinaryOperatorName, LoopOperatorLabel, LoopOperatorName, OperatorLabel,
    OperatorName,
    UnaryOperatorName
} from "@app_component/operator_builder/interfaces/OperatorName";
const Code = ({code}: {code: string}) => {
    return (
        <span style={{
            background: '#2b2b2b',
            color: '#e6e6e6',
            padding: '1px 6px',
            borderRadius: '4px',
            fontFamily: `"Courier New", monospace`,
            fontSize: '12px',
            display: 'inline-block',
        }}>{code}</span>
    )
}
export const LoopOperatorTourContents: {[name in LoopOperatorName]: ReactNode} = {
    [LoopOperatorName.For]: 'Unary operator: iterates over each element of an array. The operator processes every item in the selected array reference.',
    [LoopOperatorName.ForIn]: 'Unary operator: iterates over each character of a string. The operator processes the string symbol by symbol.',
    [LoopOperatorName.SplitString]: 'Splits a string using the specified delimiter and iterates over the resulting parts. The right value defines the separator.',
}

export const IfOperatorTourContents: {[name in OperatorName]: ReactNode} = {
    [BinaryOperatorName.AllowList]: <p>
        <p><span>Description:</span> Checks if a string matches any patterns in a list.</p>
        <p>
            <span>Arguments:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={'o1'}/>:
                    String to match.
                </li>
                <li>
                    <Code code={'o2'}/>:
                    A list of patterns or a single comma-separated string of patterns.
                </li>
            </ul>
        </p>
        <p>
            <span>Examples:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={`o1 = "test1", o2 = "test1,test2,test3"`}/> → Returns <Code code={'true'}/>
                </li>
                <li>
                    <Code code={`o1 = "test4", o2 = "test1,test2,test3"`}/> → Returns <Code code={'false'}/>
                </li>
            </ul>
        </p>
    </p>,
    [BinaryOperatorName.DenyList]: <p>
        <p><span>Description:</span> Ensures a value is not in a restricted list.</p>
        <p>
            <span>Arguments:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={'o1'}/>:
                    A value to check.
                </li>
                <li>
                    <Code code={'o2'}/>:
                    A list or string of restricted values.
                </li>
            </ul>
        </p>
        <p>
            <span>Examples:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={`o1 = "guest", o2 = "admin,user,manager"`}/> → Returns <Code code={'true'}/>
                </li>
                <li>
                    <Code code={`o1 = "admin", o2 = "admin,user,manager"`}/> → Returns <Code code={'false'}/>
                </li>
            </ul>
        </p>
    </p>,
    [BinaryOperatorName.Contains]: <p>
        <p><span>Description:</span> Checks if a list contains a specific value.</p>
        <p><span>Arguments:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li><Code code={'o1'}/>: A list of items to search within (can be <Code code={'null'}/> if <Code
                    code={'o2'}/> is a valid list).
                </li>
                <li><Code code={'o2'}/>: A single value or a list where the first element is the value to search for,
                    and the second element is the list.
                </li>
            </ul>
        </p>
        <p>
            <span>Examples:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={`o1 = ["apple", "banana", "cherry"], o2 = "banana"`}/> → Returns <Code code={'true'}/>
                </li>
                <li>
                    <Code code={`o1 = null, o2 = ["banana", ["apple", "banana", "cherry"]]`}/> → Returns <Code
                    code={'true'}/>
                </li>
                <li>
                    <Code code={`o1 = ["apple", "banana"], o2 = "grape"`}/> → Returns <Code code={'false'}/>
                </li>
            </ul>
        </p>
    </p>,
    [BinaryOperatorName.NotContains]: <p>
        <p><span>Description:</span> Validates that a value is not in a list.</p>
        <p>
            <span>Arguments:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={'o1'}/>:
                    A list to search within.
                </li>
                <li>
                    <Code code={'o2'}/>:
                    A value to check for.
                </li>
            </ul>
        </p>
        <p>
            <span>Examples:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={`o1 = ["apple", "banana"], o2 = "cherry"`}/> → Returns <Code code={'true'}/>
                </li>
                <li>
                    <Code code={`o1 = ["apple", "banana"], o2 = "apple"`}/> → Returns <Code code={'false'}/>
                </li>
            </ul>
        </p>
    </p>,
    [BinaryOperatorName.ContainsSubStr]: <p>
        <p><span>Description:</span> Checks if any string in a list contains a specified substring.</p>
        <p>
            <span>Arguments:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={'o1'}/>:
                    A list of strings to search within (can be <Code code={'null'}/> if <Code code={'o2'}/> is a valid
                    list).
                </li>
                <li>
                    <Code code={'o2'}/>:
                    A substring to search for or a list where the first element is the substring and the second element
                    is the list.
                </li>
            </ul>
        </p>
        <p>
            <span>Examples:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={`o1 = ["hello", "world", "java"], o2 = "wor"`}/> → Returns <Code code={'true'}/>
                </li>
                <li>
                    <Code code={`o1 = null, o2 = ["wor", ["hello", "world", "java"]]`}/> → Returns <Code code={'true'}/>
                </li>
                <li>
                    <Code code={`o1 = null, o2 = "wor"`}/> → Throws <Code code={'RuntimeException'}/> (invalid input)
                </li>
                <li>
                    <Code code={`o1 = ["apple", "banana"], o2 = "pine"`}/> → Returns <Code code={'false'}/>
                </li>
            </ul>
        </p>
    </p>,
    [BinaryOperatorName.NotContainsSubStr]: <p>
        <p><span>Description:</span> Validates that a substring is not found in any string in a list.</p>
        <p>
            <span>Arguments:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={'o1'}/>:
                    A list of strings to search within (can be <Code code={'null'}/> if <Code code={'o2'}/> is a valid
                    list).
                </li>
                <li>
                    <Code code={'o2'}/>:
                    A substring to search for.
                </li>
            </ul>
        </p>
        <p>
            <span>Examples:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={`o1 = ["hello", "world"], o2 = "java"`}/> → Returns <Code code={'true'}/>
                </li>
                <li>
                    <Code code={`o1 = ["hello", "java"], o2 = "java"`}/> → Returns <Code code={'false'}/>
                </li>
                <li>
                    <Code code={`o1 = null, o2 = ["java", ["hello", "world"]]`}/> → Returns <Code code={'true'}/>
                </li>
            </ul>
        </p>
    </p>,
    [BinaryOperatorName.PropertyExists]: <p>
        <p><span>Description:</span> Checks if a property (key or value) exists in a collection.</p>
        <p>
            <span>Arguments:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={'o1'}/>:
                    A map, list, or set.
                </li>
                <li>
                    <Code code={'o2'}/>:
                    A key or value to check for.
                </li>
            </ul>
        </p>
        <p>
            <span>Examples:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={`o1 = {"key1": "value1"}, o2 = "key1"`}/> → Returns <Code code={'true'}/>
                </li>
                <li>
                    <Code code={`o1 = ["apple", "banana"], o2 = "cherry"`}/> → Returns <Code code={'false'}/>
                </li>
            </ul>
        </p>
    </p>,
    [BinaryOperatorName.PropertyNotExists]: <p>
        <p><span>Description:</span> Validates that a property does not exist in a collection.</p>
        <p>
            <span>Arguments:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={'o1'}/>:
                    A map, list, or set.
                </li>
                <li>
                    <Code code={'o2'}/>:
                    A key or value to check for.
                </li>
            </ul>
        </p>
        <p>
            <span>Examples:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={`o1 = {"key1": "value1"}, o2 = "key2"`}/> → Returns <Code code={'true'}/>
                </li>
                <li>
                    <Code code={`o1 = {"key1": "value1"}, o2 = "key1"`}/> → Returns <Code code={'false'}/>
                </li>
            </ul>
        </p>
    </p>,
    [BinaryOperatorName.Like]: <p>
        <p><span>Description:</span> Performs SQL-style "LIKE" pattern matching.</p>
        <p>
            <span>Arguments:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={'o1'}/>:
                    String to evaluate.
                </li>
                <li>
                    <Code code={'o2'}/>:
                    Pattern string (<Code code={'%'}/> is a wildcard).
                </li>
            </ul>
        </p>
        <p>
            <span>Examples:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={`o1 = "hello", o2 = "h%o"`}/> → Returns <Code code={'true'}/>
                </li>
                <li>
                    <Code code={`o1 = "hello", o2 = "h%z"`}/> → Returns <Code code={'false'}/>
                </li>
            </ul>
        </p>
    </p>,
    [BinaryOperatorName.NotLike]: <p>
        <p><span>Description:</span> Validates that a string does not match a "LIKE" pattern.</p>
        <p>
            <span>Arguments:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={'o1'}/>:
                    String to evaluate.
                </li>
                <li>
                    <Code code={'o2'}/>:
                    Pattern string (<Code code={'%'}/> is a wildcard).
                </li>
            </ul>
        </p>
        <p>
            <span>Examples:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={`o1 = "hello", o2 = "h%o"`}/> → Returns <Code code={'false'}/>
                </li>
                <li>
                    <Code code={`o1 = "hello", o2 = "h%z"`}/> → Returns <Code code={'true'}/>
                </li>
            </ul>
        </p>
    </p>,
    [BinaryOperatorName.IsTypeOf]: <p>
        <p><span>Description:</span> Checks if an object is of a specific type.</p>
        <p>
            <span>Arguments:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={'o1'}/>:
                    An object to check.
                </li>
                <li>
                    <Code code={'o2'}/>:
                    A string representing the expected type.
                </li>
            </ul>
        </p>
        <p>
            <span>Examples:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={`o1 = 123, o2 = "Integer"`}/> → Returns <Code code={'true'}/>
                </li>
                <li>
                    <Code code={`o1 = "text", o2 = "Integer"`}/> → Returns <Code code={'false'}/>
                </li>
            </ul>
        </p>
    </p>,
    [BinaryOperatorName.RegEx]: <p>
        <p><span>Description:</span> Matches a string against a regular expression.</p>
        <p>
            <span>Arguments:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={'o1'}/>:
                    Input string.
                </li>
                <li>
                    <Code code={'o2'}/>:
                    Regular expression.
                </li>
            </ul>
        </p>
        <p>
            <span>Examples:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={`o1 = "123abc", o2 = "\\\\d+"`}/> → Returns <Code code={'true'}/>
                </li>
                <li>
                    <Code code={`o1 = "abc", o2 = "\\\\d+"`}/> → Returns <Code code={'false'}/>
                </li>
            </ul>
        </p>
    </p>,
    [BinaryOperatorName.Equal]: <p>
        <p><span>Description:</span> Compares two values for equality.</p>
        <p>
            <span>Arguments:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={'o1'}/>:
                    First value to compare.
                </li>
                <li>
                    <Code code={'o2'}/>:
                    Second value to compare.
                </li>
            </ul>
        </p>
        <p>
            <span>Examples:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={`o1 = "test", o2 = "test"`}/> → Returns <Code code={'true'}/>
                </li>
                <li>
                    <Code code={`o1 = "test1", o2 = "test2"`}/> → Returns <Code code={'false'}/>
                </li>
            </ul>
        </p>
    </p>,
    [BinaryOperatorName.NotEqual]: <p>
        <p><span>Description:</span> Validates that two values are not equal.</p>
        <p>
            <span>Arguments:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={'o1'}/>:
                    First value to compare.
                </li>
                <li>
                    <Code code={'o2'}/>:
                    Second value to compare.
                </li>
            </ul>
        </p>
        <p>
            <span>Examples:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={`o1 = "test1", o2 = "test2"`}/> → Returns <Code code={'true'}/>
                </li>
                <li>
                    <Code code={`o1 = "test1", o2 = "test1"`}/> → Returns <Code code={'false'}/>
                </li>
            </ul>
        </p>
    </p>,
    [BinaryOperatorName.GreaterThan]: <p>
        <p><span>Description:</span> Checks if the first numeric value is greater than the second.</p>
        <p>
            <span>Arguments:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={'o1'}/>:
                    First numeric value.
                </li>
                <li>
                    <Code code={'o2'}/>:
                    Second numeric value.
                </li>
            </ul>
        </p>
        <p>
            <span>Examples:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={`o1 = 5, o2 = 3`}/> → Returns <Code code={'true'}/>
                </li>
                <li>
                    <Code code={`o1 = 2, o2 = 5`}/> → Returns <Code code={'false'}/>
                </li>
            </ul>
        </p>
    </p>,
    [BinaryOperatorName.GreaterThanOrEqualTo]: <p>
        <p><span>Description:</span> Checks if the first numeric value is greater than or equal to the second.</p>
        <p>
            <span>Arguments:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={'o1'}/>:
                    First numeric value.
                </li>
                <li>
                    <Code code={'o2'}/>:
                    Second numeric value.
                </li>
            </ul>
        </p>
        <p>
            <span>Examples:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={`o1 = 5, o2 = 5`}/> → Returns <Code code={'true'}/>
                </li>
                <li>
                    <Code code={`o1 = 3, o2 = 5`}/> → Returns <Code code={'false'}/>
                </li>
            </ul>
        </p>
    </p>,
    [BinaryOperatorName.LessThan]: <p>
        <p><span>Description:</span> Checks if the first numeric value is less than the second.</p>
        <p>
            <span>Arguments:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={'o1'}/>:
                    First numeric value.
                </li>
                <li>
                    <Code code={'o2'}/>:
                    Second numeric value.
                </li>
            </ul>
        </p>
        <p>
            <span>Examples:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={`o1 = 2, o2 = 5`}/> → Returns <Code code={'true'}/>
                </li>
                <li>
                    <Code code={`o1 = 6, o2 = 5`}/> → Returns <Code code={'false'}/>
                </li>
            </ul>
        </p>
    </p>,
    [BinaryOperatorName.LessThanOrEqualTo]: <p>
        <p><span>Description:</span> Checks if the first numeric value is less than or equal to the second.</p>
        <p>
            <span>Arguments:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={'o1'}/>:
                    First numeric value.
                </li>
                <li>
                    <Code code={'o2'}/>:
                    Second numeric value.
                </li>
            </ul>
        </p>
        <p>
            <span>Examples:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={`o1 = 5, o2 = 5`}/> → Returns <Code code={'true'}/>
                </li>
                <li>
                    <Code code={`o1 = 7, o2 = 5`}/> → Returns <Code code={'false'}/>
                </li>
            </ul>
        </p>
    </p>,

    [UnaryOperatorName.IsEmpty]: <p>
        <p><span>Description:</span> Verifies if a list is empty.</p>
        <p>
            <span>Arguments:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={'o1'}/>:
                    A list to check (cannot be <Code code={'null'}/>).
                </li>
                <li>
                    <Code code={'o2'}/>:
                    Ignored.
                </li>
            </ul>
        </p>
        <p>
            <span>Examples:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={`o1 = [], o2 = null`}/> → Returns <Code code={'true'}/>
                </li>
                <li>
                    <Code code={`o1 = [1, 2], o2 = null`}/> → Returns <Code code={'false'}/>
                </li>
                <li>
                    <Code code={`o1 = null, o2 = null`}/> → Throws <Code code={'RuntimeException'}/>
                </li>
            </ul>
        </p>
    </p>,
    [UnaryOperatorName.NotEmpty]: <p>
        <p><span>Description:</span> Verifies if a list is not empty.</p>
        <p>
            <span>Arguments:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={'o1'}/>:
                    A list to check (cannot be <Code code={'null'}/>).
                </li>
                <li>
                    <Code code={'o2'}/>:
                    Ignored.
                </li>
            </ul>
        </p>
        <p>
            <span>Examples:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={`o1 = [1, 2], o2 = null`}/> → Returns <Code code={'true'}/>
                </li>
                <li>
                    <Code code={`o1 = [], o2 = null`}/> → Returns <Code code={'false'}/>
                </li>
                <li>
                    <Code code={`o1 = null, o2 = null`}/> → Throws <Code code={'RuntimeException'}/>
                </li>
            </ul>
        </p>
    </p>,
    [UnaryOperatorName.IsNull]: <p>
        <p><span>Description:</span> Validates that an object is null.</p>
        <p>
            <span>Arguments:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={'o1'}/>:
                    An object to check.
                </li>
                <li>
                    <Code code={'o2'}/>:
                    Ignored.
                </li>
            </ul>
        </p>
        <p>
            <span>Examples:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={`o1 = null, o2 = null`}/> → Returns <Code code={'true'}/>
                </li>
                <li>
                    <Code code={`o1 = "value", o2 = null`}/> → Returns <Code code={'false'}/>
                </li>
            </ul>
        </p>
    </p>,
    [UnaryOperatorName.NotNull]: <p>
        <p><span>Description:</span> Validates that an object is not null.</p>
        <p>
            <span>Arguments:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={'o1'}/>:
                    An object to check.
                </li>
                <li>
                    <Code code={'o2'}/>:
                    Ignored.
                </li>
            </ul>
        </p>
        <p>
            <span>Examples:</span>
            <ul style={{marginLeft: '20px', display: 'grid', gap: '2px'}}>
                <li>
                    <Code code={`o1 = "hello", o2 = null`}/> → Returns <Code code={'true'}/>
                </li>
                <li>
                    <Code code={`o1 = null, o2 = null`}/> → Returns <Code code={'false'}/>
                </li>
            </ul>
        </p>
    </p>,

}

export function getLoopOperatorTours(name: LoopOperatorName): Step[] {
    return [
        {
            title: LoopOperatorLabel[name],
            content: LoopOperatorTourContents[name],
            target: '',
            placement: 'bottom',
            disableBeacon: true,
            hideCloseButton: true,
            hideFooter: true,
            data: {
            }
        }
    ]
}


export function getIfOperatorTours(name: OperatorName): Step[] {
    return [
        {
            title: OperatorLabel[name],
            content: IfOperatorTourContents[name],
            target: '',
            placement: 'bottom',
            disableBeacon: true,
            hideCloseButton: true,
            hideFooter: true,
            data: {
                width: 800,
            }
        }
    ]
}

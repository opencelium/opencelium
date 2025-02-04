import { v4 as uuidv4 } from "uuid";
import {UnaryOperatorName, BinaryOperatorName, AllOperatorNames, OperatorName} from './interfaces/OperatorName';
import {Conjunction, GroupProps, RuleProps} from './props';
export const generateUUID = (): string => {
    return uuidv4();
};
export const isUnaryOperator = (operator: string): operator is UnaryOperatorName => {
    return Object.values(UnaryOperatorName).includes(operator as UnaryOperatorName);
};

export const isBinaryOperator = (operator: string): operator is BinaryOperatorName => {
    return Object.values(BinaryOperatorName).includes(operator as BinaryOperatorName);
};
export function jsonToString(json: GroupProps | RuleProps): string {
    if (json.type === 'rule') {
        const { leftField, operator, rightField } = json.properties || {};
        const operatorName = getEnumKeyByValue(AllOperatorNames, operator)
        return rightField ? `'${leftField}' ${operatorName} '${rightField}'` : `'${leftField}' ${operatorName}`;
    }

    if (json.type === 'group' && json.items) {
        const conjunction = json.properties?.conjunction.toUpperCase();
        const itemsString = json.items.map(jsonToString).join(` ${conjunction} `);
        return `(${itemsString})`;
    }

    return '';
}


export function stringToJson(input: string): GroupProps | RuleProps | any {
    const parseRule = (ruleStr: string): RuleProps | {} => {
        const match = ruleStr.match(/(.+) (\S+) (.+)/);
        if (match) {
            return {
                id: generateUUID(),
                type: 'rule',
                properties: {
                    leftField: match[1].trim(),
                    operator: match[2].trim() as OperatorName,
                    rightField: match[3].trim(),
                }
            };
        }
        const matchSingle = ruleStr.match(/(.+) (\S+)/);
        if (matchSingle) {
            return {
                id: generateUUID(),
                type: 'rule',
                properties: {
                    leftField: matchSingle[1].trim(),
                    operator: matchSingle[2].trim() as OperatorName,
                }
            };
        }
        return {};
    };

    const parseGroup = (groupStr: string): GroupProps | any => {
        const regex = /\((.*)\)/;
        const match = groupStr.match(regex);
        if (!match) throw new Error("Invalid group format");

        let content = match[1];
        let conjunction = content.includes(` ${Conjunction.AND} `) ? Conjunction.AND : Conjunction.OR;
        let items = content.split(` ${conjunction} `).map(part => part.includes("(") ? parseGroup(part) : parseRule(part));

        return {
            id: generateUUID(),
            type: 'group',
            properties: {
                conjunction,
            },
            items
        };
    };

    return input.includes("(") ? parseGroup(input) : parseRule(input);
}

function getEnumKeyByValue(enumData: any, value: string): string | undefined {
    const entry = Object.entries(enumData).find(([key, val]) => val === value);
    return entry ? entry[0] : undefined;
}

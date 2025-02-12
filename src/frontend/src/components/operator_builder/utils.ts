import {v4 as uuidv4} from "uuid";
import {BinaryOperatorName, OperatorName, UnaryOperatorName} from './interfaces/OperatorName';
import {Conjunction, GroupProps, OperatorType, RuleProps} from './props';
import OperatorTypeFactory from "@app_component/operator_builder/classes/OperatorTypeFactory";

export const generateUUID = (): string => {
    return uuidv4();
};
export const isUnaryOperator = (operator: string): operator is UnaryOperatorName => {
    return Object.values(UnaryOperatorName).includes(operator as UnaryOperatorName);
};

export const isBinaryOperator = (operator: string): operator is BinaryOperatorName => {
    return Object.values(BinaryOperatorName).includes(operator as BinaryOperatorName);
};
export function jsonToString(json: GroupProps | RuleProps, type: OperatorType): { result: string; isNotValid: boolean } {
    if (json.type === 'rule') {
        const { leftField, operator, rightField } = json.properties || {};
        const isNotValid = (new OperatorTypeFactory(type)).isExpressionNotValid({leftField, operator, rightField});
        const result = (new OperatorTypeFactory(type)).getExpressionFormat({leftField, operator, rightField});
        return { result, isNotValid };
    }

    if (json.type === 'group' && json.items) {
        const conjunction = json.properties?.conjunction?.toUpperCase();
        let isNotValid = false;
        let itemsString: string | string[] = json.items.map(item => {
            const { result, isNotValid: itemInvalid } = jsonToString(item, type);
            if (itemInvalid) isNotValid = true;
            return result;
        });
        if (conjunction) {
            itemsString = itemsString.join(` ${conjunction} `);
        } else {
            itemsString = itemsString.join('');
        }
        switch (type) {
            case OperatorType.Loop:
                return { result: itemsString, isNotValid };
            case OperatorType.If:
                return { result: `(${itemsString})`, isNotValid };
        }
    }

    return { result: '', isNotValid: true };
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

export function getEnumKeyByValue(enumData: any, value: string): string | undefined {
    const entry: any = Object.entries(enumData).find(([key, val]) => val === value);
    return entry ? entry[1] : undefined;
}

export const flattenOptions = (groups: any[]) =>
    groups.flatMap((group) => group.options);

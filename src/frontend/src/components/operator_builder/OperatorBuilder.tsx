import React, {useMemo, useState} from 'react';
import Group from './Group';
import {ChildProps, GroupProps, OperatorBuilderProps, RuleProps, ValidationResult} from './props';
import {generateUUID, jsonToString} from "./utils";
import {SaveOperatorButton} from "@app_component/operator_builder/styles";
import OperatorTypeFactory from "@app_component/operator_builder/classes/OperatorTypeFactory";
import {LoopOperatorName, UnaryOperatorName} from "@app_component/operator_builder/interfaces/OperatorName";
import {EmptyString} from "@app_component/operator_builder/reference_generator/ReferenceGenerator";
import Button from '@app_component/base/button/Button';

export const ErrorColor = '#a42525';
const OperatorBuilder = (props: OperatorBuilderProps) => {
    const existedTree = useMemo(() => {
        if (!props.item) {
            return {};
        }
        const operator = props.connector.getOperatorByIndex(props.item.index);
        let generatedTree;
        if (operator?.expression && !operator.uiId) {
            generatedTree = (new OperatorTypeFactory(props.type)).generateTreeByExpression(operator.expression);
        }
        const foundTree = props.connection.ui?.operators.find((o: any) => o.id === operator?.uiId);
        const initialTree = (new OperatorTypeFactory(props.type)).getInitialTree();
        return generatedTree || foundTree || {...initialTree, id: generateUUID()};
    }, [props.item, props.connection]);
    const [showDetails, toggleDetails] = useState<boolean>(false);
    const [tree, setTree] = useState<GroupProps>(existedTree);
    const validateGroup = (group: GroupProps): string | undefined => {
        if (!group.items || group.items.length === 0) {
            return `There are no rules in this group.`;
        }
        if (group.items.length === 1) {
            if (group.properties?.conjunction !== undefined) {
                return `Group with one item must not have conjunction. Conjunction: ${group.properties.conjunction}`;
            }
        } else {
            if (group.properties?.conjunction === undefined) {
                return `Group with multiple conditions must have a conjunction. Conjunction is missing.`;
            }
        }
        return undefined;
    };

    const validateRule = (rule: RuleProps): string | undefined => {
        if (!rule?.properties?.leftField || !rule?.properties?.operator) {
            return `Value is missing`;
        }
        //@ts-ignore
        if (rule.properties.operator === LoopOperatorName.For || Object.values(UnaryOperatorName).indexOf(rule.properties.operator) !== -1) {
            if (!!rule.properties.rightField && rule.properties.rightField !== EmptyString) {
                return `Right field must not be set for this operator: ${rule.properties.operator}.`;
            }
        } else {
            /*if (!rule.properties.rightField) {
                return `Right field is missing.`;
            }*/
        }
        return undefined;
    };
    const validateAndUpdateTree = (
        node: GroupProps | RuleProps
    ): ValidationResult<GroupProps | RuleProps> => {
        if (node.type === 'group') {
            const groupError = validateGroup(node);
            let updatedItems: ChildProps[] = [];
            let allChildrenValid = true;

            for (const item of node.items ?? []) {
                const result = validateAndUpdateTree(item);
                updatedItems.push(result.node);
                if (!result.isValid) {
                    allChildrenValid = false;
                }
            }

            return {
                node: {
                    ...node,
                    error: groupError,
                    items: updatedItems,
                },
                isValid: !groupError && allChildrenValid,
            };
        } else {
            const ruleError = validateRule(node);
            return {
                node: {
                    ...node,
                    error: ruleError,
                },
                isValid: !ruleError,
            };
        }
    };

    const scrollToFirstElement = () => {
        setTimeout(() => {
            const dialogContent = document.querySelector('#modal_Condition').parentElement;
            const targetElement = dialogContent?.querySelector('.error-scroll-target');

            if (dialogContent instanceof HTMLElement && targetElement instanceof HTMLElement) {
                const dialogContentRect = dialogContent.getBoundingClientRect();
                const targetElementRect = targetElement.getBoundingClientRect();

                const relativeOffset = targetElementRect.top - dialogContentRect.top;

                dialogContent.scrollTo({
                    top: dialogContent.scrollTop + relativeOffset - 60, // +100px below the target
                    behavior: 'smooth',
                });
            }
        }, 100)
    };

    const updateOperator = () => {
        const result = validateAndUpdateTree(tree);
        setTree(result.node as GroupProps);
        if (!result.isValid) {
            scrollToFirstElement();
            return;
        }
        const checkedTree = result.node as GroupProps;
        const connector = props.connection.getConnectorByType(props.connector.getConnectorType());
        const operatorItem = connector.getOperatorByIndex(props.item.index);
        const jsonToStringResult = jsonToString(checkedTree, props.type);
        operatorItem.expression = jsonToStringResult.result;
        operatorItem.uiId = checkedTree.id;
        let operators: any = props.connection?.ui?.operators || [];
        const isOperatorExist = operators.findIndex((o: any) => o.id === checkedTree.id) !== -1;
        operators = isOperatorExist ? operators.map((operator: any) => operator.id === checkedTree.id ? checkedTree : operator) : [...operators, checkedTree];
        props.connection.ui = {
            operators,
        }
        if (jsonToStringResult.isNotValid) {
            props.connection.setError({
                data: {
                    connectorId: props.connector.id,
                    index: props.item.index,
                    location: '',
                    message: 'Invalid data'
                }
            })
        }
        props.updateConnection(props.connection);
    }
    return (
        <div style={{margin: "0 20px 20px"}} id={'operator-builder'}>
            <Group
                type={props.type}
                connectionEditor={props}
                isInitial={true}
                hasNext={false}
                updateGroup={(updater) => {
                    setTree((prevTree) => {
                        return typeof updater === 'function'
                            ? updater(prevTree)
                            : { ...updater };
                    });
                }}
                group={tree}
            />
            {showDetails && <React.Fragment><p>
                {jsonToString(tree, props.type).result}
            </p>
            <pre>
                {JSON.stringify(tree, null, 2)}
            </pre></React.Fragment>}
            <SaveOperatorButton
                label={'Save'}
                handleClick={updateOperator}
            />
            <Button handleClick={() => toggleDetails(!showDetails)} label={'Show details'} style={{display: 'none', float: 'right', marginTop: '30px', marginRight: '30px'}}/>
        </div>
    )
}

export default OperatorBuilder;

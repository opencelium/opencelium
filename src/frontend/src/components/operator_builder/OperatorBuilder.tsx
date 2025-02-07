import React, {useEffect, useMemo, useState} from 'react';
import Group from './Group';
import {GroupProps, OperatorBuilderProps} from './props';
import {generateUUID, jsonToString} from "./utils";
import {SaveOperatorButton} from "@app_component/operator_builder/styles";
import OperatorTypeFactory from "@app_component/operator_builder/classes/OperatorTypeFactory";

const OperatorBuilder = (props: OperatorBuilderProps) => {
    const existedTree = useMemo(() => {
        if (!props.operator) {
            return {};
        }
        const operator = props.connector.getOperatorByIndex(props.operator.index);
        const foundTree = props.connection.ui?.operators.find((o: any) => o.id === operator?.uiId);
        const initialTree = (new OperatorTypeFactory(props.type)).getInitialTree();
        return foundTree || {...initialTree, id: generateUUID()};
    }, [props.operator, props.connection]);
    const [tree, setTree] = useState<GroupProps>(existedTree);
    const updateOperator = () => {
        const connector = props.connection.getConnectorByType(props.connector.getConnectorType());
        const operatorItem = connector.getOperatorByIndex(props.operator.index);
        const jsonToStringResult = jsonToString(tree, props.type);
        operatorItem.expression = jsonToStringResult.result;
        operatorItem.uiId = tree.id;
        let operators: any = props.connection?.ui?.operators || [];
        const isOperatorExist = operators.findIndex((o: any) => o.id === tree.id) !== -1;
        operators = isOperatorExist ? operators.map((operator: any) => operator.id === tree.id ? tree : operator) : [...operators, tree];
        props.connection.ui = {
            operators,
        }
        if (jsonToStringResult.isNotValid) {
            props.connection.setError({
                data: {
                    connectorId: props.connector.id,
                    index: props.operator.index,
                    location: '',
                    message: 'Invalid data'
                }
            })
        }
        props.updateConnection(props.connection);
    }
    return (
        <div style={{margin: 20}}>
            <Group builderProps={props} isInitial={true} hasNext={false} updateGroup={(newGroup) => setTree({...newGroup})} group={tree}/>
            <p>
                {jsonToString(tree, props.type).result}
            </p>
            {/*<pre>
                {JSON.stringify(tree, null, 2)}
            </pre>*/}
            <SaveOperatorButton
                label={'Save'}
                handleClick={updateOperator}
            />
        </div>
    )
}

export default OperatorBuilder;

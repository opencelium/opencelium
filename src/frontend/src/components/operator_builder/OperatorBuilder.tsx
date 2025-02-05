import React, {useEffect, useMemo, useState} from 'react';
import Group from './Group';
import {Conjunction, GroupProps, OperatorBuilderProps} from './props';
import {generateUUID, jsonToString, stringToJson} from "./utils";
import Button from "@basic_components/buttons/Button";
import {SaveOperatorButton} from "@app_component/operator_builder/styles";

const initialTree: GroupProps = {
    id: generateUUID(),
    type: 'group',
    properties: {
        conjunction: Conjunction.AND,
        not: false,
    }
};
const OperatorBuilder = (props: OperatorBuilderProps) => {
    const existedTree = useMemo(() => {
        const operator = props.connector.getOperatorByIndex(props.operator.index);
        const foundTree = props.connection.ui?.operators.find((o: any) => o.id === operator?.uiId);
        return foundTree || {...initialTree, id: generateUUID()};
    }, [props.operator, props.connection]);
    const [tree, setTree] = useState<GroupProps>(existedTree);
    const updateOperator = () => {
        const connector = props.connection.getConnectorByType(props.connector.getConnectorType());
        const operatorItem = connector.getOperatorByIndex(props.operator.index);
        operatorItem.expression = jsonToString(tree);
        operatorItem.uiId = tree.id;
        let operators: any = props.connection?.ui?.operators || [];
        const isOperatorExist = operators.findIndex((o: any) => o.id === tree.id) !== -1;
        operators = isOperatorExist ? operators.map((operator: any) => operator.id === tree.id ? tree : operator) : [...operators, tree];
        props.connection.ui = {
            operators,
        }
        props.updateConnection(props.connection);
    }
    return (
        <div style={{margin: 20}}>
            <Group builderProps={props} isInitial={true} hasNext={false} updateGroup={(newGroup) => setTree({...newGroup})} group={tree}/>
            <p>
                {jsonToString(tree)}
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

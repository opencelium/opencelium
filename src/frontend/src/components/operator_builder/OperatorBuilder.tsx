import React, {useState} from 'react';
import Group from './Group';
import {Conjunction, GroupProps, OperatorBuilderProps} from './props';
import {generateUUID, jsonToString, stringToJson} from "./utils";

const initialTree: GroupProps = {
    id: generateUUID(),
    type: 'group',
    properties: {
        conjunction: Conjunction.AND,
        not: false,
    }
};
const OperatorBuilder = (props: OperatorBuilderProps) => {
    const [tree, setTree] = useState<GroupProps>(initialTree);
    return (
        <div style={{margin: 20}}>
            <Group builderProps={props} isInitial={true} hasNext={false} updateGroup={(newGroup) => setTree({...newGroup})} group={tree}/>
            <p>
                {jsonToString(tree)}
            </p>
            <pre>
                {JSON.stringify(tree, null, 2)}
            </pre>
        </div>
    )
}

export default OperatorBuilder;

import React, {FC, useState} from 'react';
import AceEditor from "react-ace";
import {
    AggregatorFormProps,
} from "./interfaces";
import InputSelect from "@app_component/base/input/select/InputSelect";
import Arguments from "./arguments/Arguments";
import AddArgument from "./arguments/AddArgument";
import Button from "@app_component/base/button/Button";


const AggregatorForm:FC<AggregatorFormProps> = ({readOnly, allItems, aggregator, isAdd}) => {
    const [items, setItems] = useState(aggregator.assignedItems || []);
    const [args, setArgs] = useState(aggregator.args || []);
    const [script, setScript] = useState<string>(aggregator.script || '');
    const add = () => {

    }
    const update = () => {

    }
    return (
        <React.Fragment>
            <InputSelect
                id={`input_aggregator_items`}
                readOnly={readOnly}
                onChange={(option: any) => setItems(option)}
                value={items}
                icon={'line_end'}
                label={'Item'}
                options={allItems}
                isMultiple={true}
            />
            <Arguments args={args} readOnly={readOnly}/>
            <AddArgument/>
            <AceEditor
                mode="javascript"
                theme="tomorrow"
                onChange={setScript}
                name="input_aggregator_script"
                editorProps={{$blockScrolling: true}}
                showPrintMargin={true}
                showGutter={true}
                highlightActiveLine={true}
                value={script}
                height={'330px'}
                width={'100%'}
                readOnly={readOnly}
                setOptions={{
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: true,
                    enableSnippets: true,
                    showLineNumbers: false,
                    tabSize: 2,
                    useWorker: false,
                }}
            />
            {!readOnly &&
                <Button
                    label={isAdd ? 'Add' : 'Update'}
                    icon={isAdd ? 'add' : 'update'}
                    handleClick={isAdd ? add : update}
                />
            }
        </React.Fragment>
    )
}

export default AggregatorForm;

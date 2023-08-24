import React, {FC, useState, useMemo} from 'react';
import _ from 'lodash';
import {
    DataAggregatorProps
} from "./interfaces";
import Dialog from "@basic_components/Dialog";
import Button from "@app_component/base/button/Button";
import AggregatorForm
    from "./AggregatorForm";
import DialogTitle from "./DialogTitle";

//@ts-ignore
import styles from './styles.scss';
import ModelDataAggregator from "@root/requests/models/DataAggregator";


const DataAggregator:FC<DataAggregatorProps> = ({connection, updateConnection, readOnly}) => {
    const [showDialog, setShowDialog] = useState<boolean>(false);
    const [isForm, setIsForm] = useState<boolean>(true);
    const [isAdd, setIsAdd] = useState<boolean>(true);
    const allMethods = connection.getAllMethods();
    const allOperators = connection.getAllOperators();
    const allMethodOptions = useMemo(() => {
        return _.uniqWith(allMethods.map(m => {return {label: m.label || m.name, value: m.name }}), _.isEqual);
    }, [allMethods]);
    const allOperatorOptions = useMemo(() => {
        return _.uniqWith(allOperators.map(o => {return {label: o.index, value: o.index }}), _.isEqual);
    }, [allOperators]);
    const actions = isForm ? [] : [
        {
            id: 'action_data_aggregator',
            label: 'Close',
            onClick: () => setShowDialog(!showDialog)
        }
    ];
    const add = (aggregator: ModelDataAggregator) => {
        connection.addDataAggregator(aggregator);
        updateConnection(connection);
    }
    return (
        <React.Fragment>
            <Button
                isDisabled={allMethodOptions.length === 0}
                label={'Aggregator'}
                icon={'subtitles'}
                handleClick={() => {setShowDialog(true); setIsForm(true);}}
            />
            <Dialog
                actions={actions}
                active={showDialog}
                toggle={() => setShowDialog(!showDialog)}
                title={<DialogTitle setIsForm={setIsForm} isForm={isForm}/>}
                theme={{dialog: styles.aggregator_dialog}}
            >
                {isForm &&
                    <AggregatorForm
                        aggregator={null}
                        readOnly={readOnly}
                        allMethods={allMethodOptions}
                        allOperators={allOperatorOptions}
                        add={add}
                        isAdd={isAdd}
                    />
                }
            </Dialog>
        </React.Fragment>
    )
}

export default DataAggregator;

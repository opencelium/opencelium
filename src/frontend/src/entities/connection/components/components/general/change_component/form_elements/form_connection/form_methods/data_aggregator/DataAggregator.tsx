import React, {FC, useState, useMemo} from 'react';
import _ from 'lodash';
import {
    DataAggregatorProps, FormType,
} from "./interfaces";
import Dialog from "@basic_components/Dialog";
import Button from "@app_component/base/button/Button";
import AggregatorForm
    from "./AggregatorForm";
import DialogTitle from "./DialogTitle";

//@ts-ignore
import styles from './styles.scss';
import ModelDataAggregator from "@root/requests/models/DataAggregator";
import AggregatorList from './AggregatorList';


const DataAggregator:FC<DataAggregatorProps> = ({connection, updateConnection, readOnly}) => {
    const [showDialog, setShowDialog] = useState<boolean>(false);
    const [isForm, setIsForm] = useState<boolean>(false);
    const [formType, setFormType] = useState<FormType>('add');
    const [currentAggregator, setCurrentAggregator] = useState<ModelDataAggregator>(null);
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
            icon: 'add',
            label: 'Add Aggregator',
            onClick: () => {setCurrentAggregator(null); setIsForm(true); setFormType('add')},
        },
        {
            id: 'action_data_aggregator',
            label: 'Close',
            onClick: () => setShowDialog(!showDialog)
        }
    ];
    const add = (aggregator: ModelDataAggregator) => {
        aggregator.id = '5';
        connection.addDataAggregator(aggregator);
        setIsForm(false);
        updateConnection(connection);
    }
    const update = (aggregator: ModelDataAggregator) => {
        connection.updateDataAggregator(aggregator);
        updateConnection(connection);
        setIsForm(false);
    }
    return (
        <React.Fragment>
            <Button
                isDisabled={allMethodOptions.length === 0}
                label={'Aggregator'}
                icon={'subtitles'}
                handleClick={() => {setShowDialog(true); if(connection.dataAggregator.length === 0){ setIsForm(true); }}}
            />
            <Dialog
                actions={actions}
                active={showDialog}
                toggle={() => setShowDialog(!showDialog)}
                title={<DialogTitle setIsForm={setIsForm} isForm={isForm} hasList={connection.dataAggregator.length > 0}/>}
                theme={{dialog: styles.aggregator_dialog}}
            >
                {isForm ?
                    <AggregatorForm
                        aggregator={currentAggregator}
                        dataAggregator={connection.dataAggregator}
                        readOnly={readOnly}
                        allMethods={allMethodOptions}
                        allOperators={allOperatorOptions}
                        add={add}
                        update={update}
                        formType={formType}
                        closeForm={connection.dataAggregator.length > 0 ? () => {setIsForm(false); setCurrentAggregator(null);} : null}
                    />
                    :
                    <AggregatorList
                        setFormType={(type: FormType, aggregator: ModelDataAggregator) => {setFormType(type); setCurrentAggregator(aggregator); setIsForm(true)}}
                        dataAggregator={connection.dataAggregator}
                        updateConnection={updateConnection}
                    />
                }
            </Dialog>
        </React.Fragment>
    )
}

export default DataAggregator;

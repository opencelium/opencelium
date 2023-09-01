import React, {FC, useState, useMemo, useEffect} from 'react';
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
import {CDataAggregator} from "@root/classes/CDataAggregator";
import {useAppDispatch} from "@application/utils/store";
import {setCurrentAggregator as setCurrentStateAggregator} from '@entity/connection/redux_toolkit/slices/DataAggregatorSlice';
import {addAggregator, updateAggregator} from '@entity/connection/redux_toolkit/action_creators/DataAggregatorCreators';


const DataAggregator:FC<DataAggregatorProps> = ({connection, updateConnection, readOnly}) => {
    const dispatch = useAppDispatch();
    const {currentAggregator: currentStateAggregator} = CDataAggregator.getReduxState();
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
    useEffect(() => {
        if(currentStateAggregator){
            if(formType === 'add'){
                connection.addDataAggregator(currentStateAggregator);
            }
            if(formType === 'update'){
                connection.updateDataAggregator(currentStateAggregator);
            }
            updateConnection(connection);
            setIsForm(false);
            dispatch(setCurrentStateAggregator(null));
        }
    }, [currentStateAggregator]);
    const add = (aggregator: ModelDataAggregator) => {
        dispatch(addAggregator({aggregator, connectionId: connection.id}));
    }
    const update = (aggregator: ModelDataAggregator) => {
        dispatch(updateAggregator({aggregator, connectionId: connection.id}));
    }
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

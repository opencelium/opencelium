import React, {FC, useState, useMemo, useEffect} from 'react';
import _ from 'lodash';
import {
    DataAggregatorProps, FormType,
} from "./interfaces";
import Dialog from "@basic_components/Dialog";
import Button from "@app_component/base/button/Button";
import AggregatorForm
    from "./DataAggregatorDialogForm";
import DialogTitle from "./title/DialogTitle";

//@ts-ignore
import styles from './styles.scss';
import ModelDataAggregator from "@entity/data_aggregator/requests/models/DataAggregator";
import DataAggregatorList from './DataAggregatorList';
import {CDataAggregator} from "@entity/data_aggregator/classes/CDataAggregator";
import {useAppDispatch} from "@application/utils/store";
import {setCurrentAggregator as setCurrentStateAggregator} from '@entity/data_aggregator/redux_toolkit/slices/DataAggregatorSlice';
import {
    addAggregator,
    getAllAggregators,
    updateAggregator
} from '@entity/data_aggregator/redux_toolkit/action_creators/DataAggregatorCreators';
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import TooltipButton from '@app_component/base/tooltip_button/TooltipButton';
import { ColorTheme } from '@style/Theme';


const DataAggregatorButton:FC<DataAggregatorProps> = ({connection, updateConnection, readOnly, tooltipButtonProps}) => {
    const dispatch = useAppDispatch();
    const {currentAggregator: currentStateAggregator, aggregators, gettingAllAggregators} = CDataAggregator.getReduxState();
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
        dispatch(getAllAggregators());
    }, [])
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
        dispatch(addAggregator(aggregator));
    }
    const update = (aggregator: ModelDataAggregator) => {
        dispatch(updateAggregator(aggregator));
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
            {!tooltipButtonProps &&
                <Button
                    isDisabled={allMethodOptions.length === 0}
                    label={'Aggregator'}
                    icon={'subtitles'}
                    isLoading={gettingAllAggregators === API_REQUEST_STATE.START}
                    handleClick={() => {setShowDialog(true); if(aggregators.length === 0){ setIsForm(true); }}}
                />
            }
            {tooltipButtonProps && 
                <TooltipButton 
                    position={tooltipButtonProps.position} 
                    icon={tooltipButtonProps.icon} 
                    tooltip={tooltipButtonProps.tooltip} 
                    target={tooltipButtonProps.target} 
                    hasBackground={tooltipButtonProps.hasBackground} 
                    background={!showDialog ? ColorTheme.White : ColorTheme.Blue} 
                    color={!showDialog ? ColorTheme.Gray : ColorTheme.White} 
                    padding={tooltipButtonProps.padding} 
                    handleClick={() => {setShowDialog(true); if(aggregators.length === 0){ setIsForm(true); }}}
                />
            }
            <Dialog
                actions={actions}
                active={showDialog}
                toggle={() => setShowDialog(!showDialog)}
                title={<DialogTitle setIsForm={setIsForm} isForm={isForm} hasList={aggregators.length > 0}/>}
                theme={{dialog: styles.aggregator_dialog}}
            >
                {isForm ?
                    <AggregatorForm
                        aggregator={currentAggregator}
                        dataAggregator={aggregators}
                        readOnly={readOnly}
                        allMethods={allMethodOptions}
                        allOperators={allOperatorOptions}
                        add={add}
                        update={update}
                        formType={formType}
                        closeForm={aggregators.length > 0 ? () => {setIsForm(false); setCurrentAggregator(null);} : null}
                    />
                    :
                    <DataAggregatorList
                        setFormType={(type: FormType, aggregator: ModelDataAggregator) => {setFormType(type); setCurrentAggregator(aggregator); setIsForm(true)}}
                    />
                }
            </Dialog>
        </React.Fragment>
    )
}

export default DataAggregatorButton;

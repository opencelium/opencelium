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
import {
    setCurrentAggregator, toggleDataAggregatorModal,
    setIsForm, setFormType,
} from '@entity/data_aggregator/redux_toolkit/slices/DataAggregatorSlice';
import {
    addAggregator, getAllUnarchivedAggregators, updateAggregator,
} from '@entity/data_aggregator/redux_toolkit/action_creators/DataAggregatorCreators';
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import TooltipButton from '@app_component/base/tooltip_button/TooltipButton';
import { ColorTheme } from '@style/Theme';

const prohibitEscForCode = (event: any, toggle: any) => {
    event = event || window.event;
    let isEscape = false;
    if ("key" in event) {
        isEscape = (event.key === "Escape" || event.key === "Esc");
    } else {
        isEscape = (event.keyCode === 27);
    }
    if (isEscape) {
        if(event.target.className === 'ace_text-input'){
            toggle(true);
        } else{
            toggle(false);
        }
    }
}

const DataAggregatorButton:FC<DataAggregatorProps> = ({connection, updateConnection, readOnly, tooltipButtonProps}) => {
    const dispatch = useAppDispatch();
    const {
        currentAggregator, unarchivedAggregators, addingAggregator, updatingAggregator,
        gettingAllAggregators, isDataAggregatorModalToggled, isForm, formType,
    } = CDataAggregator.getReduxState();
    const [hasStartedAction, setAction] = useState<boolean>(false);
    const [isToggleDialogDisabled, toggle] = useState<boolean>(false);
    const allMethods = connection.getAllMethods();
    const allOperators = connection.getAllOperators();
    const allMethodOptions = useMemo(() => {
        return _.uniqWith(allMethods.map(m => {return {label: m.label || m.name, value: m.color, color: m.color }}), _.isEqual);
    }, [allMethods]);
    const allOperatorOptions = useMemo(() => {
        return _.uniqWith(allOperators.map(o => {return {label: o.index, value: o.index }}), _.isEqual);
    }, [allOperators]);
    const setShowDialog = (value: boolean) => {
        dispatch(toggleDataAggregatorModal(value));
    }
    useEffect(() => {
        dispatch(getAllUnarchivedAggregators());
    }, [])
    useEffect(() => {
        if(isDataAggregatorModalToggled){
            document.addEventListener('keydown', (e) => prohibitEscForCode(e, toggle));
        } else{
            document.removeEventListener('keydown', (e) => prohibitEscForCode(e, toggle));
            toggle(false);
        }
    }, [isDataAggregatorModalToggled])
    useEffect(() => {
        if(addingAggregator === API_REQUEST_STATE.FINISH && hasStartedAction){
            if(formType === 'add'){
                connection.addDataAggregator(currentAggregator);
            }
            updateConnection(connection);
            dispatch(setIsForm(false));
            dispatch(setCurrentAggregator(null));
            setAction(false);
        }
    }, [addingAggregator]);
    useEffect(() => {
        if(updatingAggregator === API_REQUEST_STATE.FINISH && hasStartedAction){
            connection.updateDataAggregator(currentAggregator);
            updateConnection(connection);
            dispatch(setIsForm(false));
            dispatch(setCurrentAggregator(null));
            setAction(false);
        }
    }, [updatingAggregator]);
    const add = (aggregator: ModelDataAggregator) => {
        dispatch(addAggregator(aggregator));
        setAction(true);
    }
    const update = (aggregator: ModelDataAggregator) => {
        dispatch(updateAggregator(aggregator));
        setAction(true);
    }
    const actions = isForm ? [] : [
        {
            icon: 'add',
            label: 'Add Aggregator',
            onClick: () => {
                dispatch(setCurrentAggregator(null));
                dispatch(setIsForm(true));
                dispatch(setFormType('add'));
            },
        },
        {
            id: 'action_data_aggregator',
            label: 'Close',
            onClick: () => setShowDialog(!isDataAggregatorModalToggled)
        }
    ];
    return (
        <React.Fragment>
            {!tooltipButtonProps &&
                <Button
                    isDisabled={allMethodOptions.length === 0 || readOnly}
                    label={'Aggregator'}
                    icon={'subtitles'}
                    isLoading={gettingAllAggregators === API_REQUEST_STATE.START}
                    handleClick={() => {
                        setShowDialog(true);
                        if(unarchivedAggregators.length === 0){
                            dispatch(setIsForm(true));
                        }
                    }}
                />
            }
            {tooltipButtonProps &&
                <TooltipButton
                    isDisabled={readOnly}
                    position={tooltipButtonProps.position}
                    icon={tooltipButtonProps.icon}
                    tooltip={tooltipButtonProps.tooltip}
                    target={tooltipButtonProps.target}
                    hasBackground={tooltipButtonProps.hasBackground}
                    background={!isDataAggregatorModalToggled ? ColorTheme.White : ColorTheme.Blue}
                    color={!isDataAggregatorModalToggled ? ColorTheme.Gray : ColorTheme.White}
                    padding={tooltipButtonProps.padding}
                    handleClick={() => {
                        setShowDialog(true);
                        if(unarchivedAggregators.length === 0){
                            dispatch(setIsForm(true));
                        }
                    }}
                />
            }
            <Dialog
                actions={actions}
                active={isDataAggregatorModalToggled}
                toggle={isToggleDialogDisabled ? () => {} : () => setShowDialog(!isDataAggregatorModalToggled)}
                title={<DialogTitle hasList={unarchivedAggregators.length > 0}/>}
                theme={{dialog: styles.aggregator_dialog}}
            >
                {isForm ?
                    <AggregatorForm
                        dataAggregator={unarchivedAggregators}
                        readOnly={readOnly}
                        allMethods={allMethodOptions}
                        allOperators={allOperatorOptions}
                        add={add}
                        update={update}
                        closeForm={unarchivedAggregators.length > 0 ? () => {
                            dispatch(setIsForm(false));
                            dispatch(setCurrentAggregator(null));
                        } : null}
                    />
                    :
                    <DataAggregatorList
                        setFormType={(type: FormType, aggregator: ModelDataAggregator) => {
                            dispatch(setFormType(type));
                            dispatch(setCurrentAggregator(aggregator));
                            dispatch(setIsForm(true))}}
                    />
                }
            </Dialog>
        </React.Fragment>
    )
}

export default DataAggregatorButton;

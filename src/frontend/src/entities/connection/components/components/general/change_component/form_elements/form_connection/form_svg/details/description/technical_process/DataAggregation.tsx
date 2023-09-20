import React, { useEffect } from 'react';
import SelectableInput
    from "@change_component/form_elements/form_connection/form_svg/details/description/SelectableInput";
import {CDataAggregator} from "@entity/data_aggregator/classes/CDataAggregator";
import {useAppDispatch} from "@application/utils/store";
import {getAllAggregators} from "@entity/data_aggregator/redux_toolkit/action_creators/DataAggregatorCreators";
import {setCurrentTechnicalItem} from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import {
    setCurrentAggregator, setFormType, setIsForm,
    toggleDataAggregatorModal,
} from '@entity/data_aggregator/redux_toolkit/slices/DataAggregatorSlice';

export default
({
    readOnly,
    currentItem,
    connection,
    updateConnection,
    details
}: any) => {
    const dispatch = useAppDispatch();
    const {aggregators} = CDataAggregator.getReduxState();
    useEffect(() => {
        dispatch(getAllAggregators());
    }, [])
    const changeAggregator = (optionValue: any) => {
        if(optionValue) {
            const connector = connection.getConnectorByType(details.connectorType);
            let dataAggregator = aggregators.find(a => a.id === optionValue.value);
            let item = connector.getItemByIndex(details.entity.index);
            item.dataAggregator = dataAggregator ? dataAggregator.id : null;
            const currentTechnicalItem = connector.getSvgElementByIndex(item.index);
            updateConnection(connection);
            dispatch(setCurrentTechnicalItem(currentTechnicalItem.getObject()));
        }
    }

    const getAggregator = () => {
        let aggregator = null;
        if(currentItem && currentItem.dataAggregator){
            aggregator = aggregators.find(a => a.id === currentItem.dataAggregator)
        }
        if(aggregator) {
            aggregator = aggregator.name;
        } else{
            aggregator = 'is empty';
        }
        return aggregator;
    }

    const aggregator = getAggregator();

    const openDataAggregator = () => {
        let agg = null;
        if(currentItem && currentItem.dataAggregator){
            agg = aggregators.find(a => a.id === currentItem.dataAggregator)
            if(agg) {
                dispatch(setFormType('update'));
                dispatch(setCurrentAggregator(agg));
                dispatch(setIsForm(true));
                dispatch(toggleDataAggregatorModal(true));
            }
        }
    }

    return(
        <SelectableInput
            id={`data_aggregation_options`}
            readOnly={readOnly}
            options={CDataAggregator.getOptionsForSelect(aggregators)}
            changeValue={changeAggregator}
            label={'Aggregation'}
            value={aggregator}
            onTextValueClick={aggregator !== 'is empty' ? openDataAggregator : null}
        />
    );
}

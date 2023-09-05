import React, {FC, useEffect, useState} from 'react';
import {
    AggregatorListProps,
} from "../pages/interfaces";
import CollectionView from "@app_component/collection/collection_view/CollectionView";
import DataAggregatorCollection from "@entity/data_aggregator/collections/DataAggregator";
import {TextSize} from "@app_component/base/text/interfaces";
import TooltipButton from "@app_component/base/tooltip_button/TooltipButton";
import ModelDataAggregator from "@entity/data_aggregator/requests/models/DataAggregator";
import {useAppDispatch} from "@application/utils/store";
import {getAllAggregators} from "@entity/data_aggregator/redux_toolkit/action_creators/DataAggregatorCreators";
import {CDataAggregator} from "@entity/data_aggregator/classes/CDataAggregator";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";


const DataAggregatorList:FC<AggregatorListProps> =
    ({
        setFormType,
    }) => {
    const dispatch = useAppDispatch();
    const {
        error, aggregators, gettingAllAggregators,
    } = CDataAggregator.getReduxState();
    const getListActions = (entity: ModelDataAggregator) => {
        return (
            <React.Fragment>
                <TooltipButton handleClick={() => setFormType('update', entity)} target={`update_entity_${entity.id.toString()}`} position={'top'} tooltip={'Update'} hasBackground={false} icon={'edit'} size={TextSize.Size_20}/>
                <TooltipButton handleClick={() => setFormType('view', entity)} target={`view_entity_${entity.id.toString()}`} position={'top'} tooltip={'View'} hasBackground={false} icon={'visibility'} size={TextSize.Size_20}/>
                <TooltipButton handleClick={() => {const aggregator = {...entity}; delete aggregator.id; setFormType('add', {...aggregator, name: `${entity.name} [copy]`})}} target={`copy_entity_${entity.id.toString()}`} position={'top'} tooltip={'Copy'} hasBackground={false} icon={'content_copy'} size={TextSize.Size_20}/>
            </React.Fragment>
        );
    };
    useEffect(() => {
        dispatch(getAllAggregators());
    }, [])
    const CollectionAggregator = new DataAggregatorCollection(aggregators, getListActions);
    return (
        <CollectionView hasError={!!error} isLoading={gettingAllAggregators === API_REQUEST_STATE.START} collection={CollectionAggregator} hasViewSection={false} hasTitle={false} isListViewCard={false}/>
    )
}

export default DataAggregatorList;

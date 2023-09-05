import React, {FC, useEffect, useState} from 'react';
import CollectionView, {ViewType} from "@app_component/collection/collection_view/CollectionView";
import DataAggregatorCollection from "@entity/data_aggregator/collections/DataAggregator";
import {useAppDispatch} from "@application/utils/store";
import {getAllAggregators} from "@entity/data_aggregator/redux_toolkit/action_creators/DataAggregatorCreators";
import {CDataAggregator} from "@entity/data_aggregator/classes/CDataAggregator";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";


const DataAggregatorList:FC =
    ({
    }) => {
    const dispatch = useAppDispatch();
    const {
        error, aggregators, gettingAllAggregators,
    } = CDataAggregator.getReduxState();
    const [shouldBeUpdated, setShouldBeUpdated] = useState(false);
    useEffect(() => {
        dispatch(getAllAggregators());
    }, [])
    useEffect(() => {
        setShouldBeUpdated(!shouldBeUpdated);
    }, [aggregators])
    const CollectionAggregator = new DataAggregatorCollection(aggregators);
    return (
        <CollectionView defaultViewType={ViewType.LIST} hasViewSection={false} hasError={!!error} shouldBeUpdated={shouldBeUpdated} collection={CollectionAggregator} isLoading={gettingAllAggregators === API_REQUEST_STATE.START}/>
    )
}

export default DataAggregatorList;

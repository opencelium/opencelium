import React, {FC, useEffect, useState} from 'react';
import CollectionView, {ViewType} from "@app_component/collection/collection_view/CollectionView";
import DataAggregatorCollection from "@entity/data_aggregator/collections/DataAggregator";
import {useAppDispatch} from "@application/utils/store";
import {
    deleteAggregatorById,
    getAllAggregators
} from "@entity/data_aggregator/redux_toolkit/action_creators/DataAggregatorCreators";
import {CDataAggregator} from "@entity/data_aggregator/classes/CDataAggregator";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import ModelDataAggregator from "@entity/data_aggregator/requests/models/DataAggregator";
import TooltipButton from "@app_component/base/tooltip_button/TooltipButton";
import {TextSize} from "@app_component/base/text/interfaces";


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
    const getListActions = (entity: ModelDataAggregator) => {
        return (
            <React.Fragment>
                <TooltipButton href={`${entity.id}/update`} target={`update_entity_${entity.id.toString()}`} position={'top'} tooltip={'Update'} hasBackground={false} icon={'edit'} size={TextSize.Size_20}/>
                <TooltipButton href={`${entity.id}/view`} target={`view_entity_${entity.id.toString()}`} position={'top'} tooltip={'View'} hasBackground={false} icon={'visibility'} size={TextSize.Size_20}/>
                <TooltipButton target={`delete_entity_${entity.id.toString()}`} position={'top'} tooltip={'Delete'} hasConfirmation confirmationText={'Do you really want to delete?'} handleClick={() => dispatch(deleteAggregatorById(entity.id))} hasBackground={false} icon={'delete'} size={TextSize.Size_20}/>
            </React.Fragment>
        );
    };
    const CollectionAggregator = new DataAggregatorCollection(aggregators, getListActions);
    return (
        <CollectionView defaultViewType={ViewType.LIST} hasViewSection={false} hasError={!!error} shouldBeUpdated={shouldBeUpdated} collection={CollectionAggregator} isLoading={gettingAllAggregators === API_REQUEST_STATE.START}/>
    )
}

export default DataAggregatorList;

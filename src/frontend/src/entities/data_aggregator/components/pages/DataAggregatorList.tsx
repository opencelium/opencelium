import React, {FC, useEffect, useState} from 'react';
import CollectionView, {ViewType} from "@app_component/collection/collection_view/CollectionView";
import DataAggregatorCollection from "@entity/data_aggregator/collections/DataAggregator";
import {useAppDispatch} from "@application/utils/store";
import {
    archiveAggregatorById,
    getAllAggregators, unarchiveAggregatorById
} from "@entity/data_aggregator/redux_toolkit/action_creators/DataAggregatorCreators";
import {CDataAggregator} from "@entity/data_aggregator/classes/CDataAggregator";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import ModelDataAggregator, {ModelDataAggregatorProps} from "@entity/data_aggregator/requests/models/DataAggregator";
import TooltipButton from "@app_component/base/tooltip_button/TooltipButton";
import {TextSize} from "@app_component/base/text/interfaces";
import {AggregatorActive} from "@entity/data_aggregator/components/aggregator_active/AggregatorActive";
import {ListProp} from "@application/interfaces/IListCollection";


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
    }, [JSON.stringify(aggregators)])
    const getListActions = (entity: ModelDataAggregator) => {
        return (
            <React.Fragment>
                <TooltipButton isDisabled={entity.active === false} href={`${entity.id}/update`} target={`update_entity_${entity.id.toString()}`} position={'top'} tooltip={'Update'} hasBackground={false} icon={'edit'} size={TextSize.Size_20}/>
                <TooltipButton href={`${entity.id}/view`} target={`view_entity_${entity.id.toString()}`} position={'top'} tooltip={'View'} hasBackground={false} icon={'visibility'} size={TextSize.Size_20}/>
            </React.Fragment>
        );
    };
    const listProps: ListProp<ModelDataAggregatorProps>[] = [
        {
            propertyKey: 'active',
            getValue: (aggregator: ModelDataAggregator) => {
                return (
                    <AggregatorActive
                        key={aggregator.id}
                        aggregator={aggregator}
                        onClick={() => {
                            if(aggregator.active === false){
                                dispatch(unarchiveAggregatorById(aggregator.id));
                            } else{
                                dispatch(archiveAggregatorById(aggregator.id));
                            }
                        }}
                    />
                )},
            replace: true,
            width: '10%',
        }
    ]
    const CollectionAggregator = new DataAggregatorCollection(aggregators, getListActions, listProps);
    return (
        <CollectionView defaultViewType={ViewType.LIST} hasViewSection={false} hasError={!!error} shouldBeUpdated={shouldBeUpdated} collection={CollectionAggregator} isLoading={gettingAllAggregators === API_REQUEST_STATE.START}/>
    )
}

export default DataAggregatorList;

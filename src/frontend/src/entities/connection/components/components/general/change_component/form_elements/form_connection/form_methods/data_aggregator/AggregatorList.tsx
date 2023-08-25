import React, {FC, useState} from 'react';
import {
    AggregatorListProps,
} from "./interfaces";
import CollectionView from "@app_component/collection/collection_view/CollectionView";
import DataAggregatorCollection from "@root/collections/DataAggregator";
import {TextSize} from "@app_component/base/text/interfaces";
import TooltipButton from "@app_component/base/tooltip_button/TooltipButton";
import ModelDataAggregator from "@root/requests/models/DataAggregator";


const AggregatorList:FC<AggregatorListProps> =
    ({
        dataAggregator,
        setFormType,
    }) => {
    const getListActions = (entity: ModelDataAggregator) => {
        return (
            <React.Fragment>
                <TooltipButton handleClick={() => setFormType('update', entity)} target={`update_entity_${entity.id.toString()}`} position={'top'} tooltip={'Update'} hasBackground={false} icon={'edit'} size={TextSize.Size_20}/>
                <TooltipButton handleClick={() => setFormType('view', entity)} target={`view_entity_${entity.id.toString()}`} position={'top'} tooltip={'View'} hasBackground={false} icon={'visibility'} size={TextSize.Size_20}/>
                <TooltipButton handleClick={() => {const aggregator = {...entity}; delete aggregator.id; setFormType('add', {...aggregator, name: `${entity.name} [copy]`})}} target={`copy_entity_${entity.id.toString()}`} position={'top'} tooltip={'Copy'} hasBackground={false} icon={'content_copy'} size={TextSize.Size_20}/>
            </React.Fragment>
        );
    };
    const CDataAggregator = new DataAggregatorCollection(dataAggregator, getListActions);
    return (
        <CollectionView collection={CDataAggregator} hasViewSection={false} hasTitle={false} isListViewCard={false}/>
    )
}

export default AggregatorList;

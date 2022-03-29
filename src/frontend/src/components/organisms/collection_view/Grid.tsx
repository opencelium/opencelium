import React, {FC, useEffect, useState} from 'react';
import {withTheme} from 'styled-components';
import {SortType, ViewProps} from './interfaces';
import {
    GridActionsStyled,
    GridImageStyled,
    GridStyled,
    GridSubTitleStyled,
    GridTitleStyled,
    InfoStyled
} from './styles';
import {Card} from "@atom/card/Card";
import {isString} from "../../../utils";
import {EmptyList} from "@molecule/list/EmptyList";
import {useNavigate} from "react-router";
import Text from "@atom/text/Text";
import {TextSize} from "@atom/text/interfaces";
import {Image} from "@molecule/image/Image";
import {Console} from "@class/application/Console";

const Grid: FC<ViewProps> =
    ({
        collection,
        searchValue,
        currentPage,
        gridViewType,
        entitiesPerPage,
        componentPermission,
        isRefreshing,
        shouldBeUpdated,
    }) => {
    let navigate = useNavigate();
    const [visibleEntities, setVisibleEntities] = useState<any[]>([]);
    useEffect(() => {
        let newSortTypes: any = {};
        setVisibleEntities(collection.getEntitiesByPage(searchValue, 1, entitiesPerPage));
        for(let i = 0; i < collection.sortingProps.length; i++){
            newSortTypes[collection.sortingProps[i]] = SortType.asc;
        }
    }, []);
    useEffect(() => {
        let newVisibleEntities = collection.getEntitiesByPage(searchValue, currentPage, entitiesPerPage);
        setVisibleEntities(newVisibleEntities);
    }, [currentPage, searchValue, entitiesPerPage, collection.entities.length, shouldBeUpdated]);
    if(visibleEntities.length === 0){
        return (
            <Card padding={'10px'} margin={'0 0 20px 0'}>
                <EmptyList/>
            </Card>
        );
    }
    return (
        <GridStyled>
            {visibleEntities.map((entity) => {
                const actionsData = collection.getGridActions(entity, componentPermission);
                // @ts-ignore
                const title = collection.gridProps?.title ? isString(collection.gridProps.title) ? entity[collection.gridProps.title] : collection.gridProps.title(entity) : '';
                // @ts-ignore
                const subtitle = collection.gridProps?.subtitle ? isString(collection.gridProps.subtitle) ? entity[collection.gridProps.subtitle] : collection.gridProps.subtitle(entity) : '';
                // @ts-ignore
                const imageSrc = collection.gridProps?.image ? isString(collection.gridProps.image) ? entity[collection.gridProps.image] : collection.gridProps.image(entity) : '';
                const hasImage = !!collection.gridProps?.image;
                const link = collection.hasCardLink ? entity.link : '';
                const onCardClick = () => {
                    if(link) {
                        if(collection.isCardLinkExternal){
                            window.open(link, '_blank');
                        } else{
                            navigate(link, { replace: false });
                        }
                    }
                }
                const uploadImage = (image: any) => {
                    if(collection.uploadImage){
                        collection.uploadImage(entity, image);
                    } else{
                        Console.print('This collection does not have uploadImage handler')
                    }
                }
                const hasUpload = !!collection.uploadingImage && !!collection.uploadImage;
                return (
                    <Card key={entity[collection.keyPropName]} isRefreshing={isRefreshing} gridViewType={gridViewType} isListCard={true} onClick={onCardClick} isButton={link !== ''}>
                        <div>
                            <InfoStyled>
                                <GridTitleStyled><Text value={title} size={TextSize.Size_20}/></GridTitleStyled>
                                <GridSubTitleStyled><Text value={subtitle} size={TextSize.Size_14}/></GridSubTitleStyled>
                            </InfoStyled>
                            {hasImage && <GridImageStyled><Image src={imageSrc} alt={title} uploadingImage={collection.uploadingImage} uploadImage={uploadImage} hasUpload={hasUpload}/></GridImageStyled>}
                        </div>
                        <GridActionsStyled>
                            {
                                actionsData
                            }
                        </GridActionsStyled>
                    </Card>
                );
            })}
        </GridStyled>
    )
}

Grid.defaultProps = {
    isRefreshing: false,
}


export {
    Grid,
};

export default withTheme(Grid);
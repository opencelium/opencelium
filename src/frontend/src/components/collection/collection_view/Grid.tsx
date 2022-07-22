/*
 *  Copyright (C) <2022>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {FC, useEffect, useState} from 'react';
import {withTheme} from 'styled-components';
import {useNavigate} from "react-router";
import {isString} from "@application/utils/utils";
import {Console} from "@application/classes/Console";
import Text from "@app_component/base/text/Text";
import {TextSize} from "@app_component/base/text/interfaces";
import {Card} from "@app_component/base/card/Card";
import {Image} from "../image/Image"
import {SortType, ViewProps} from './interfaces';
import {
    GridActionsStyled,
    GridImageStyled,
    GridStyled,
    GridSubTitleStyled,
    GridTitleStyled,
    InfoStyled
} from './styles';
import {EmptyList} from "../EmptyList";

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
                const hasImageComponent = !!collection.gridProps?.getImageComponent;
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
                            {hasImageComponent && collection.gridProps.getImageComponent(entity)}
                            {hasImage && <GridImageStyled>
                                <Image src={imageSrc} alt={title} uploadingImage={collection.uploadingImage} uploadImage={uploadImage} hasUpload={hasUpload}/>
                            </GridImageStyled>}
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
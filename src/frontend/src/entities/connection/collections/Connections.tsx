/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React from "react";
import ListCollection from "@application/classes/ListCollection";
import {ListProp} from "@application/interfaces/IListCollection";
import {AppDispatch} from "@application/utils/store";
import {API_REQUEST_STATE, ComponentPermissionProps} from "@application/interfaces/IApplication";
import {ViewType} from "@app_component/collection/collection_view/CollectionView";
import {PermissionButton, PermissionTooltipButton} from "@app_component/base/button/PermissionButton";
import {TextSize} from "@app_component/base/text/interfaces";
import {SortType} from "@app_component/collection/collection_view/interfaces";
import {ColorTheme} from "@style/Theme";

//TODO move DuplicateIcon in connection/components
import {DuplicateIcon} from "@root/components/duplicate_icon/DuplicateIcon";
import {IConnection} from "../interfaces/IConnection";
import {Connection} from "../classes/Connection";
import {deleteConnectionsById} from "../redux_toolkit/action_creators/ConnectionCreators";
import { ConnectionPermissions } from "../constants";

class Connections extends ListCollection{
    entities: IConnection[];
    title = 'Connections';
    keyPropName ='id';
    sortingProps = ['title'];
    listProps: ListProp[] = [{propertyKey: 'title', width: '20%'}, {propertyKey: 'description', width: '30%'}, {propertyKey: 'fromConnector.title'}, {propertyKey: 'toConnector.title'}];
    gridProps = {title: 'title'};
    translations = {
        title: 'Title',
        description: 'Description',
        fromConnectorTitle: 'From Connector',
        toConnectorTitle: 'To Connector',
    };
    getTopActions = (viewType: ViewType, checkedIds: number[] = []) => {
        const hasSearch = this.hasSearch && this.entities.length > 0;
        return(
            <React.Fragment>
                <PermissionButton autoFocus={!hasSearch} key={'add_button'} icon={'add'} href={'add'} label={'Add Connection'} permission={ConnectionPermissions.CREATE}/>
                {viewType === ViewType.LIST && this.entities.length !== 0 && <PermissionButton isDisabled={checkedIds.length === 0} hasConfirmation confirmationText={'Do you really want to delete?'}  key={'delete_button'} icon={'delete'} label={'Delete Selected'} handleClick={() => this.dispatch(deleteConnectionsById(checkedIds))} permission={ConnectionPermissions.DELETE}/>}
            </React.Fragment>
        );
    };
    getListActions?: (entity: any, componentPermission: ComponentPermissionProps) => React.ReactNode = (entity: any, componentPermission: ComponentPermissionProps) => {
        const hasDeleteButton = !this.isCurrentItem(entity);
        return (
            <React.Fragment>
                <DuplicateIcon listConnection={entity}/>
                <PermissionTooltipButton target={`view_entity_${entity.id.toString()}`} position={'top'} tooltip={'View'} href={`${entity.id}/view`} hasBackground={false} icon={'visibility'} color={ColorTheme.Turquoise} size={TextSize.Size_20} permission={componentPermission.READ}/>
                <PermissionTooltipButton target={`update_entity_${entity.id.toString()}`} position={'top'} tooltip={'Update'} href={`${entity.id}/update`} hasBackground={false} icon={'edit'} color={ColorTheme.Turquoise} size={TextSize.Size_20} permission={componentPermission.UPDATE}/>
                {hasDeleteButton && <PermissionTooltipButton target={`delete_entity_${entity.id.toString()}`} position={'top'} tooltip={'View'} hasConfirmation confirmationText={'Do you really want to delete?'} handleClick={() => entity.deleteById()} hasBackground={false} icon={'delete'} color={ColorTheme.Turquoise} size={TextSize.Size_20} permission={componentPermission.DELETE}/>}
            </React.Fragment>
        );
    };
    dispatch: AppDispatch = null;
    deletingEntitiesState: API_REQUEST_STATE = API_REQUEST_STATE.INITIAL;

    constructor(connections: any[], dispatch: AppDispatch, deletingEntitiesState?: API_REQUEST_STATE) {
        super();
        let connectionInstances = [];
        if(connections) {
            for (let i = 0; i < connections.length; i++) {
                connectionInstances.push(new Connection({...connections[i], dispatch}));
            }
        }
        this.dispatch = dispatch;
        this.deletingEntitiesState = deletingEntitiesState;
        this.entities = [...connectionInstances];
    }

    search(connection: IConnection, searchValue: string){
        searchValue = searchValue.toLowerCase();
        let checkTitle = connection.title ? connection.title.toLowerCase().indexOf(searchValue) !== -1 : false;
        let checkDescription = connection.description ? connection.description.toLowerCase().indexOf(searchValue) !== -1 : false;
        // @ts-ignore
        let checkFromConnector = connection && connection.fromConnector && connection.fromConnector.title ? connection.fromConnector.title.toLowerCase().indexOf(searchValue) !== -1 : false;
        // @ts-ignore
        let checkToConnector = connection && connection.toConnector && connection.toConnector.title ? connection.toConnector.title.toLowerCase().indexOf(searchValue) !== -1 : false;
        return checkTitle || checkDescription || checkFromConnector || checkToConnector;
    }

    sort(sortingProp: string, sortingType: SortType): void{
        switch (sortingProp){
            case 'title':
                this.entities = this.entities.sort((a: IConnection, b: IConnection) => {
                    if(sortingType === SortType.asc){
                        return this.asc(a.title, b.title);
                    } else{
                        return this.desc(a.title, b.title);
                    }
                })
                break;
        }
    }
}

export default Connections;
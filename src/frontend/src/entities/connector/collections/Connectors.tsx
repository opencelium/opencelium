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

import React from "react";
import ListCollection from "@application/classes/ListCollection";
import {ListProp} from "@application/interfaces/IListCollection";
import {AppDispatch} from "@application/utils/store";
import {Application} from "@application/classes/Application";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {SortType} from "@app_component/collection/collection_view/interfaces";
import {PermissionButton} from "@app_component/base/button/PermissionButton";
import {ViewType} from "@app_component/collection/collection_view/CollectionView";
import {IConnector} from "../interfaces/IConnector";
import {Connector} from "../classes/Connector";
import {
    deleteConnectorsById, updateConnector,
    uploadConnectorImage
} from "../redux_toolkit/action_creators/ConnectorCreators";
import ModelConnector from "../requests/models/Connector";
import {ConnectorPermissions} from "../constants";
import {InlineEditInput} from "@app_component/collection/collection_view/InlineEditInput";

class Connectors extends ListCollection{
    entities: IConnector[];
    title = 'Connectors';
    keyPropName ='id';
    sortingProps = ['title'];
    listProps: ListProp[] = [
        {
            propertyKey: 'title',
            width: '20%',
            getValue: (entity: IConnector) => {
                return(
                    <InlineEditInput isInProcess={this.updatingConnector === API_REQUEST_STATE.START} updateValue={(newValue) => this.dispatch(updateConnector({hasCheck: false, entityData: {...entity.getPoustModel(), title: newValue}}))} initialValue={entity.title}/>
                )
            }
        },
        {
            propertyKey: 'description',
            width: '30%',
            getValue: (entity: IConnector) => {
                return(
                    <InlineEditInput isInProcess={this.updatingConnector === API_REQUEST_STATE.START} updateValue={(newValue) => this.dispatch(updateConnector({hasCheck: false, entityData: {...entity.getPoustModel(), description: newValue}}))} initialValue={entity.description}/>
                )
            }
        },
        {propertyKey: 'invoker.name'}
    ];
    gridProps = {
        title: 'title',
        image: (connector: IConnector) => {return Application.isValidImageUrl(connector.icon) ? connector.icon : connector.invoker.icon;},
    };
    translations = {
        title: 'Title',
        description: 'Description',
        invokerName: 'Invoker',
    };
    getTopActions = (viewType: ViewType, checkedIds: number[] = []) => {
        const hasSearch = this.hasSearch && this.entities.length > 0;
        return(
            <React.Fragment>
                <PermissionButton autoFocus={!hasSearch} key={'add_button'} icon={'add'} href={'add'} label={'Add Connector'} permission={ConnectorPermissions.CREATE}/>
                {viewType === ViewType.LIST && this.entities.length !== 0 && <PermissionButton isDisabled={checkedIds.length === 0} hasConfirmation confirmationText={'Do you really want to delete?'}  key={'delete_button'} icon={'delete'} label={'Delete Selected'} handleClick={() => this.dispatch(deleteConnectorsById(checkedIds))} permission={ConnectorPermissions.DELETE}/>}
            </React.Fragment>
        );
    };
    uploadImage = (entity: any, image: any) => {
        this.dispatch(uploadConnectorImage({id: entity.id, image}));
    }
    dispatch: AppDispatch = null;
    deletingEntitiesState: API_REQUEST_STATE = API_REQUEST_STATE.INITIAL;
    updatingConnector: API_REQUEST_STATE = API_REQUEST_STATE.INITIAL;
    uploadingImage: API_REQUEST_STATE = API_REQUEST_STATE.INITIAL;

    constructor(connectors: ModelConnector[], dispatch: AppDispatch, deletingEntitiesState?: API_REQUEST_STATE, uploadingImage?: API_REQUEST_STATE, updatingConnector?: API_REQUEST_STATE) {
        super();
        let connectorInstances = [];
        for(let i = 0; i < connectors.length; i++){
            //@ts-ignore
            connectorInstances.push(new Connector({...connectors[i], dispatch}));
        }
        this.dispatch = dispatch;
        this.deletingEntitiesState = deletingEntitiesState;
        this.uploadingImage = uploadingImage;
        this.updatingConnector = updatingConnector;
        this.entities = [...connectorInstances];
    }

    search(connector: IConnector, searchValue: string){
        searchValue = searchValue.toLowerCase();
        let checkTitle = connector.title ? connector.title.toLowerCase().indexOf(searchValue) !== -1 : false;
        let checkDescription = connector.description ? connector.description.toLowerCase().indexOf(searchValue) !== -1 : false;
        // @ts-ignore
        let checkInvokerName = connector.invoker.name ? connector.invoker.name.toLowerCase().indexOf(searchValue) !== -1 : false;
        return checkTitle || checkDescription || checkInvokerName;
    }

    sort(sortingProp: string, sortingType: SortType): void{
        switch (sortingProp){
            case 'title':
                this.entities = this.entities.sort((a: IConnector, b: IConnector) => {
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

export default Connectors;
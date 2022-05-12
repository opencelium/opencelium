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
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {SortType} from "@app_component/collection/collection_view/interfaces";
import {PermissionButton} from "@app_component/base/button/PermissionButton";
import {ViewType} from "@app_component/collection/collection_view/CollectionView";
import {INotificationTemplate} from "../interfaces/INotificationTemplate";
import {NotificationTemplate} from "../classes/NotificationTemplate";
import {deleteNotificationTemplatesById} from "../redux_toolkit/action_creators/NotificationTemplateCreators";
import { NotificationTemplatePermissions } from "../constants";

class NotificationTemplates extends ListCollection{
    entities: INotificationTemplate[];
    title = [{name: 'Admin Cards', link: '/admin_cards'}, {name: 'Notification Templates'}];
    keyPropName ='id';
    sortingProps = ['name'];
    listProps: ListProp[] = [{propertyKey: 'name', width: '40%'}, {propertyKey: 'type', width: '40%'}];
    gridProps = {title: 'name'};
    translations = {
        name: 'Name',
        type: 'Type',
    };
    getTopActions = (viewType: ViewType, checkedIds: number[] = []) => {
        const hasSearch = this.hasSearch && this.entities.length > 0;
        return(
            <React.Fragment>
                <PermissionButton autoFocus={!hasSearch} key={'add_button'} icon={'add'} href={'add'} label={'Add Notification Template'} permission={NotificationTemplatePermissions.CREATE}/>
                {viewType === ViewType.LIST && this.entities.length !== 0 && <PermissionButton isDisabled={checkedIds.length === 0} hasConfirmation confirmationText={'Do you really want to delete?'}  key={'delete_button'} icon={'delete'} label={'Delete Selected'} handleClick={() => this.dispatch(deleteNotificationTemplatesById(checkedIds))} permission={NotificationTemplatePermissions.DELETE}/>}
            </React.Fragment>
        );
    };
    dispatch: AppDispatch = null;
    deletingEntitiesState: API_REQUEST_STATE = API_REQUEST_STATE.INITIAL;

    constructor(notificationTemplates: any[], dispatch: AppDispatch, deletingEntitiesState?: API_REQUEST_STATE) {
        super();
        let notificationTemplateInstances = [];
        for(let i = 0; i < notificationTemplates.length; i++){
            notificationTemplateInstances.push(new NotificationTemplate({...notificationTemplates[i], dispatch}));
        }
        this.dispatch = dispatch;
        this.deletingEntitiesState = deletingEntitiesState;
        this.entities = [...notificationTemplateInstances];
    }

    search(notificationTemplate: INotificationTemplate, searchValue: string){
        searchValue = searchValue.toLowerCase();
        let checkName = notificationTemplate.name ? notificationTemplate.name.toLowerCase().indexOf(searchValue) !== -1 : false;
        // @ts-ignore
        let checkType = notificationTemplate.type ? notificationTemplate.type.toLowerCase().indexOf(searchValue) !== -1 : false;
        return checkName || checkType;
    }

    sort(sortingProp: string, sortingType: SortType): void{
        switch (sortingProp){
            case 'name':
                this.entities = this.entities.sort((a: INotificationTemplate, b: INotificationTemplate) => {
                    if(sortingType === SortType.asc){
                        return this.asc(a.name, b.name);
                    } else{
                        return this.desc(a.name, b.name);
                    }
                })
                break;
        }
    }
}

export default NotificationTemplates;
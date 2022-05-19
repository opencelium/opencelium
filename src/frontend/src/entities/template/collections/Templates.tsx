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
import {API_REQUEST_STATE, ComponentPermissionProps} from "@application/interfaces/IApplication";
import {SortType} from "@app_component/collection/collection_view/interfaces";
import {PermissionButton, PermissionTooltipButton} from "@app_component/base/button/PermissionButton";
import {ViewType} from "@app_component/collection/collection_view/CollectionView";
import {TextSize} from "@app_component/base/text/interfaces";
import {DeleteButtonStyled} from "@app_component/collection/collection_view/styles";
import {ColorTheme} from "@style/Theme";
import {ITemplate} from "@entity/connection/interfaces/ITemplate";
import {Template} from "@entity/connection/classes/Template";
import {deleteTemplatesById, exportTemplate} from "../redux_toolkit/action_creators/TemplateCreators";
import TemplateConversionIcon from "../components/TemplateConversionIcon";
import {TemplatePermissions} from "../constants";
import ImportTemplateButton from "../components/import_template_button/ImportTemplateButton";

class Templates extends ListCollection{
    entities: ITemplate[];
    title = [{name: 'Admin Panel', link: '/admin_cards'}, {name: 'Templates'}];
    keyPropName ='id';
    sortingProps = ['name'];
    listProps: ListProp[] = [{propertyKey: 'name', width: '20%'}, {propertyKey: 'description', width: '30%'}, {propertyKey: 'connection.fromConnector.invoker.name'}, {propertyKey: 'connection.toConnector.invoker.name'}];
    gridProps = {title: 'name'};
    translations = {
        name: 'Name',
        description: 'Description',
        connectionFromConnectorInvokerName: 'From Invoker',
        connectionToConnectorInvokerName: 'To Invoker',
    };
    /*
    * TODO: implement upgrade selected templates
    */
    getTopActions = (viewType: ViewType, checkedIds: number[] = []) => {
        const hasSearch = this.hasSearch && this.entities.length > 0;
        return(
            <React.Fragment>
                <ImportTemplateButton autoFocus={!hasSearch}/>
                {/*{viewType === ViewType.LIST && this.entities.length !== 0 && <PermissionButton isDisabled={checkedIds.length === 0}  key={'upgrade_button'} icon={'play_arrow'} label={'Upgrade Selected'} handleClick={() => this.dispatch(updateTemplates([]))} permission={TemplatePermissions.UPDATE}/>}*/}
                {viewType === ViewType.LIST && this.entities.length !== 0 && <PermissionButton isDisabled={checkedIds.length === 0} hasConfirmation confirmationText={'Do you really want to delete?'}  key={'delete_button'} icon={'delete'} label={'Delete Selected'} handleClick={() => this.dispatch(deleteTemplatesById(checkedIds))} permission={TemplatePermissions.DELETE}/>}
            </React.Fragment>
        );
    };
    /*
    * TODO: implement edit template
    */
    /*
    * TODO: implement upgrade template
    */
    getListActions?: (entity: any, componentPermission: ComponentPermissionProps) => React.ReactNode = (entity: any, componentPermission: ComponentPermissionProps) => {
        const hasDeleteButton = !this.isCurrentItem(entity);
        let {dispatch, ...exportTemplateData} =  entity;
        return (
            <React.Fragment>
                {/*<AddTemplateButton name={entity.name} description={entity.description} connection={entity.connection}/>*/}
                <TemplateConversionIcon data={{template: entity.getModel()}} turquoiseTheme={true}/>
                <PermissionTooltipButton target={`export_entity_${entity.id.toString()}`} position={'top'} tooltip={'Export'} hasBackground={false} handleClick={() => this.dispatch(exportTemplate(exportTemplateData))} icon={'file_download'} color={ColorTheme.Turquoise} size={TextSize.Size_20} permission={componentPermission.READ}/>
                {/*<PermissionTooltipButton target={`update_entity_${entity.id.toString()}`} position={'top'} tooltip={'Update'} href={`${entity.id}/update`} hasBackground={false} icon={'edit'} color={ColorTheme.Turquoise} size={TextSize.Size_20} permission={componentPermission.READ}/>*/}
                {hasDeleteButton && <PermissionTooltipButton target={`delete_entity_${entity.id.toString()}`} position={'top'} tooltip={'Delete'} hasConfirmation confirmationText={'Do you really want to delete?'} handleClick={() => entity.deleteById()} hasBackground={false} icon={'delete'} color={ColorTheme.Turquoise} size={TextSize.Size_20} permission={componentPermission.DELETE}/>}
            </React.Fragment>
        );
    };
    getGridActions?: (entity: any, componentPermission: ComponentPermissionProps) => React.ReactNode = (entity: any, componentPermission: ComponentPermissionProps) => {
        const hasDeleteButton = !this.isCurrentItem(entity);
        return (
            <React.Fragment>
                {/*<PermissionButton href={`${entity.name}/update`} hasBackground={false} label={'Update'} color={ColorTheme.Black} size={TextSize.Size_16} permission={componentPermission.UPDATE}/>*/}
                {hasDeleteButton && <DeleteButtonStyled><PermissionButton hasConfirmation confirmationText={'Do you really want to delete?'} handleClick={() => entity.deleteById()} hasBackground={false} label={'Delete'} color={ColorTheme.Red} size={TextSize.Size_16} permission={componentPermission.DELETE}/></DeleteButtonStyled>}
            </React.Fragment>
        );
    };
    dispatch: AppDispatch = null;
    deletingEntitiesState: API_REQUEST_STATE = API_REQUEST_STATE.INITIAL;

    constructor(templates: any[], dispatch: AppDispatch, deletingEntitiesState?: API_REQUEST_STATE) {
        super();
        let templateInstances = [];
        for(let i = 0; i < templates.length; i++){
            templateInstances.push(new Template({...templates[i], dispatch}));
        }
        this.dispatch = dispatch;
        this.deletingEntitiesState = deletingEntitiesState;
        this.entities = [...templateInstances];
    }

    search(template: ITemplate, searchValue: string){
        searchValue = searchValue.toLowerCase();
        let checkName = template.name ? template.name.toLowerCase().indexOf(searchValue) !== -1 : false;
        let checkDescription = template.description ? template.description.toLowerCase().indexOf(searchValue) !== -1 : false;
        // @ts-ignore
        let checkFromConnector = template.connection && template.connection.fromConnector && template.connection.fromConnector.title ? template.connection.fromConnector.title.toLowerCase().indexOf(searchValue) !== -1 : false;
        // @ts-ignore
        let checkToConnector = template.connection && template.connection.toConnector && template.connection.toConnector.title ? template.connection.toConnector.title.toLowerCase().indexOf(searchValue) !== -1 : false;
        return checkName || checkDescription || checkFromConnector || checkToConnector;
    }

    sort(sortingProp: string, sortingType: SortType): void{
        switch (sortingProp){
            case 'name':
                this.entities = this.entities.sort((a: ITemplate, b: ITemplate) => {
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

export default Templates;
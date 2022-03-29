import React from "react";
import ListCollection from "../classes/application/ListCollection";
import {IExternalApplication} from "@interface/external_application/IExternalApplication";
import {ExternalApplication} from "@class/external_application/ExternalApplication";
import {SortType} from "@organism/collection_view/interfaces";
import {ListCollectionCardProps, ListProp} from "@interface/application/IListCollection";
import {ComponentPermissionProps} from "@constants/permissions";
import {PermissionButton} from "@atom/button/PermissionButton";
import {ColorTheme} from "../components/general/Theme";
import {TextSize} from "@atom/text/interfaces";

class ExternalApplications extends ListCollection{
    entities: IExternalApplication[];
    title = [{name: 'Admin Cards', link: '/admin_cards'}, {name: 'External Application'}];
    keyPropName ='id';
    listProps: ListProp[] = [{propertyKey: 'name', width: '40%'}, {propertyKey: 'status', width: '40%'}];
    gridProps: ListCollectionCardProps = {
        title: 'name',
        subtitle: 'status',
        image: (externalApplication: IExternalApplication) => {return externalApplication.icon;},
    };
    getGridActions?: (entity: any, componentPermission: ComponentPermissionProps) => React.ReactNode = (entity: any, componentPermission: ComponentPermissionProps) => {
        return null;
    };
    getListActions?: (entity: IExternalApplication, componentPermission: ComponentPermissionProps) => React.ReactNode = (entity: any, componentPermission: ComponentPermissionProps) => {
        return (
            <React.Fragment>
                <PermissionButton handleClick={() => {window.open(entity.link, '_blank').focus()}} hasBackground={false} icon={'visibility'} color={ColorTheme.Turquoise} size={TextSize.Size_20} permission={componentPermission.READ}/>
            </React.Fragment>
        );
    };
    translations = {
        name: 'Name',
        status: 'Status'
    };
    hasSearch = false;
    hasCardLink = true;
    hasCheckboxes = false;
    isCardLinkExternal = true;

    constructor(externalApplications?: any[]) {
        super();
        let externalApplicationInstances = [];
        for(let i = 0; i < externalApplications.length; i++){
            externalApplicationInstances.push(new ExternalApplication(externalApplications[i]));
        }
        this.entities = [...externalApplicationInstances];
    }

    search(externalApplication: IExternalApplication, searchValue: string){
        const checkName = externalApplication.name ? externalApplication.name.toLowerCase().indexOf(searchValue) !== -1 : false;
        return checkName;
    }

    sort(sortingProp: string, sortingType: SortType): void{
        switch (sortingProp){
            case 'name':
                this.entities = this.entities.sort((a: IExternalApplication, b: IExternalApplication) => {
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

export default ExternalApplications;
import React from "react";
import ListCollection from "../classes/application/ListCollection";
import {IAdminCard} from "@interface/application/IAdminCard";
import {AdminCard} from "@class/application/AdminCard";
import {SortType} from "@organism/collection_view/interfaces";
import {ListProp} from "@interface/application/IListCollection";
import {ComponentPermissionProps} from "@constants/permissions";
import {PermissionButton} from "@atom/button/PermissionButton";
import {ColorTheme} from "../components/general/Theme";
import {TextSize} from "@atom/text/interfaces";

class AdminCards extends ListCollection{
    entities: IAdminCard[];
    title = 'Admin Cards';
    keyPropName ='id';
    sortingProps = ['name'];
    listProps: ListProp[] = [{propertyKey: 'name'}];
    gridProps = {title: 'name'};
    translations = {
        name: 'Name',
    };
    hasCheckboxes = false;
    getGridActions?: (entity: any, componentPermission: ComponentPermissionProps) => React.ReactNode = (entity: any, componentPermission: ComponentPermissionProps) => {
        return null;
    };
    getListActions?: (entity: any, componentPermission: ComponentPermissionProps) => React.ReactNode = (entity: any, componentPermission: ComponentPermissionProps) => {
        return (
            <React.Fragment>
                <PermissionButton href={`${entity.link}`} hasBackground={false} icon={'visibility'} color={ColorTheme.Turquoise} size={TextSize.Size_20} permission={componentPermission.READ}/>
            </React.Fragment>
        );
    };
    hasCardLink = true;

    constructor(adminCards: any[]) {
        super();
        let adminCardInstances = [];
        for(let i = 0; i < adminCards.length; i++){
            adminCardInstances.push(new AdminCard(adminCards[i]));
        }
        this.entities = [...adminCardInstances];
    }

    search(adminCard: IAdminCard, searchValue: string){
        let checkName = adminCard.name ? adminCard.name.toLowerCase().indexOf(searchValue) !== -1 : false;
        return checkName;
    }

    sort(sortingProp: string, sortingType: SortType): void{
        switch (sortingProp){
            case 'name':
                this.entities = this.entities.sort((a: IAdminCard, b: IAdminCard) => {
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

export default AdminCards;
import React from "react";
import ListCollection from "../classes/application/ListCollection";
import {IConnection} from "@interface/connection/IConnection";
import {Connection} from "@class/connection/Connection";
import {SortType} from "@organism/collection_view/interfaces";
import {ListProp} from "@interface/application/IListCollection";
import {PermissionButton} from "@atom/button/PermissionButton";
import {ConnectionPermissions} from "@constants/permissions";
import {ViewType} from "@organism/collection_view/CollectionView";
import {deleteConnectionsById} from "@action/connection/ConnectionCreators";
import {AppDispatch} from "@store/store";
import {API_REQUEST_STATE} from "@interface/application/IApplication";

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
    dispatch: AppDispatch = null;
    deletingEntitiesState: API_REQUEST_STATE = API_REQUEST_STATE.INITIAL;

    constructor(connections: any[], dispatch: AppDispatch, deletingEntitiesState?: API_REQUEST_STATE) {
        super();
        let connectionInstances = [];
        if(connections) {
            for (let i = 0; i < connections.length; i++) {
                connectionInstances.push(new Connection(connections[i]));
            }
        }
        this.dispatch = dispatch;
        this.deletingEntitiesState = deletingEntitiesState;
        this.entities = [...connectionInstances];
    }

    search(connection: IConnection, searchValue: string){
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
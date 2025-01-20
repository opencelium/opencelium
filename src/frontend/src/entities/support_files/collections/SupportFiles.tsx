/*
 *  Copyright (C) <2023>  <becon GmbH>
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
import {SupportFileResponse, SupportFileResponseProps} from "@root/requests/interfaces/ISupportFile";
import {ComponentPermissionProps} from "@application/interfaces/IApplication";
import {DownloadSupportFile} from "@entity/support_files/components/download_support_file/DownloadSupportFile";
import SupportFileResponseClass from "@entity/support_files/classes/SupportFileResponseClass";
import {DeleteSupportFile} from "@entity/support_files/components/delete_support_file/DeleteSupportFile";
import {ViewType} from "@app_component/collection/collection_view/CollectionView";
import {PermissionButton} from "@app_component/base/button/PermissionButton";
import {UserGroupPermissions} from "@entity/user_group/constants";
import {DeleteSupportFiles} from "@entity/support_files/components/delete_support_files/DeleteSupportFiles";

class SupportFiles extends ListCollection<SupportFileResponseProps>{
    name: string = 'support_files';
    entities: SupportFileResponse[];
    title = 'Support Files';
    keyPropName: SupportFileResponseProps ='id';
    listProps: ListProp<SupportFileResponseProps>[] = [
        {
            propertyKey: 'connection',
            width: '30%',
            getValue: (entity: SupportFileResponse) => {
                return(
                    <div>{entity.connection.title}</div>
                )
            }
        },
        {
            propertyKey: 'supportFiles',
            width: '25%',
            getValue: (entity: SupportFileResponse) => {
                return(
                    <div>{entity.supportFiles.length > 0 ? entity.supportFiles[0] : '-'}</div>
                )
            }
        },
        {
            propertyKey: 'timestamp',
            width: '25%',
            getValue: (entity: SupportFileResponse) => {
                const supportFileInstance = new SupportFileResponseClass(entity, 'error');
                return(
                    <div>{supportFileInstance.supportFilesObjects[0].timestamp}</div>
                )
            }
        },
    ];
    translations = {
        connection: 'Connection',
        supportFiles: 'File path',
        timestamp: 'Timestamp',
    };
    getTopActions = (viewType: ViewType, checked: number[]) => {
        const hasSearch = this.hasSearch && this.entities.length > 0;
        return(
            <React.Fragment>
                {viewType === ViewType.LIST && this.entities.length !== 0 && <DeleteSupportFiles isDisabled={checked.length === 0} supportFilesResponses={this.entities.filter(entity => checked.findIndex(check => check.toString() === entity.connection.connectionId.toString()) !== -1)}/>}
            </React.Fragment>
        );
    };
    getListActions?: (entity: any, componentPermission: ComponentPermissionProps) => React.ReactNode = (entity: any, componentPermission: ComponentPermissionProps) => {
        return (
            <React.Fragment>
                <DownloadSupportFile supportFileResponse={entity}/>
                <DeleteSupportFile supportFileResponse={entity}/>
            </React.Fragment>
        );
    };
    constructor(supportFiles: SupportFileResponse[]) {
        super();
        this.entities = [...supportFiles];
    }
}

export default SupportFiles;

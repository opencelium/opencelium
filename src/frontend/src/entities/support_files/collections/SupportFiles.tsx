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
import {DeleteSupportFiles} from "@entity/support_files/components/delete_support_files/DeleteSupportFiles";

class SupportFiles extends ListCollection<SupportFileResponseProps>{
    name: string = 'support_files';
    entities: SupportFileResponse[];
    title = 'Support Files';
    keyPropName: SupportFileResponseProps ='supportFile';
    listProps: ListProp<SupportFileResponseProps>[] = [
        {
            propertyKey: 'connection',
            width: '25%',
            getValue: (entity: SupportFileResponse) => {
                return(
                    <div>{entity.connectionTitle}</div>
                )
            }
        },
        {
            propertyKey: 'supportFile',
            width: '25%',
            getValue: (entity: SupportFileResponse) => {
                return(
                    <div>{entity.supportFile || '-'}</div>
                )
            }
        },
        {
            propertyKey: 'timestamp',
            width: '20%',
            getValue: (entity: SupportFileResponse) => {
                const errorSupportFileInstance = new SupportFileResponseClass(entity, 'f');
                const successSupportFileInstance = new SupportFileResponseClass(entity, 's');
                let timestamp = errorSupportFileInstance.supportFileObject?.timestamp || '-';
                if (timestamp === '-') {
                    timestamp = successSupportFileInstance.supportFileObject?.timestamp || '-';
                }
                return(
                    <div>{timestamp}</div>
                )
            }
        },
        {
            propertyKey: 'status',
            width: '10%',
            replace: true,
            getValue: (entity: SupportFileResponse) => {
                const errorSupportFileInstance = new SupportFileResponseClass(entity, 'f');
                const successSupportFileInstance = new SupportFileResponseClass(entity, 's');
                let hasError = !!errorSupportFileInstance.supportFileObject;
                let background = hasError ? '#f5c3c3' : '#c3f5c3';
                return (
                    <td key={'status'} style={{background}}></td>
                )
            }
        },
    ];
    translations = {
        connection: 'Connection',
        supportFile: 'File path',
        timestamp: 'Timestamp',
        status: 'Status',
    };
    getTopActions = (viewType: ViewType, checked: number[]) => {
        const hasSearch = this.hasSearch && this.entities.length > 0;
        return(
            <React.Fragment>
                {viewType === ViewType.LIST && this.entities.length !== 0 && <DeleteSupportFiles isDisabled={checked.length === 0} supportFilesResponses={this.entities.filter(entity => checked.findIndex(check => check.toString() === entity.supportFile) !== -1)}/>}
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

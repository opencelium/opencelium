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

class SupportFiles extends ListCollection<SupportFileResponseProps>{
    name: string = 'support_files';
    entities: SupportFileResponse[];
    title = 'Support Files';
    keyPropName: SupportFileResponseProps ='connectionId';
    hasCheckboxes = false;
    listProps: ListProp<SupportFileResponseProps>[] = [
        {
            propertyKey: 'connectionId',
            width: '30%',
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
                return(
                    <div>{entity.supportFiles.length > 0 ? entity.supportFiles[0] : '-'}</div>
                )
            }
        },
    ];
    translations = {
        connectionId: 'Connection ID',
        supportFiles: 'File path',
        timestamp: 'Timestamp',
    };
    getListActions?: (entity: any, componentPermission: ComponentPermissionProps) => React.ReactNode = (entity: any, componentPermission: ComponentPermissionProps) => {
        return (
            <React.Fragment>
                <DownloadSupportFile supportFileResponse={entity}/>
            </React.Fragment>
        );
    };
    constructor(supportFiles: SupportFileResponse[]) {
        super();
        this.entities = [...supportFiles];
    }
}

export default SupportFiles;

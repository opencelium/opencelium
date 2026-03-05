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

import React, {FC, useEffect, useMemo, useState} from 'react';
import {withTheme} from 'styled-components';
import {DeleteSupportFileProps} from './interfaces';
import {RootState, useAppDispatch, useAppSelector} from "@application/utils/store";
import {TextSize} from "@app_component/base/text/interfaces";
import {PermissionTooltipButton} from "@app_component/base/button/PermissionButton";
import {ConnectionPermissions} from "@entity/connection/constants";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {deleteSupportFile, downloadSupportFile} from "@root/redux_toolkit/action_creators/SupportFileCreators";
import SupportFileResponseClass from "@entity/support_files/classes/SupportFileResponseClass";



const DeleteSupportFile: FC<DeleteSupportFileProps> =
    ({
         supportFileResponse,
     }) => {
        const dispatch = useAppDispatch();
        const {deletingSupportFile} = useAppSelector((state: RootState) => state.supportFileReducer);
        const [isDeleting, setIsDeleting] = useState<boolean>(false);
        const deleteFile = () => {
            setIsDeleting(true);
            dispatch(deleteSupportFile(supportFileResponse.supportFile));
        }
        const supportFileTimeStamp = useMemo(() => {
            const errorSupportFileInstance = new SupportFileResponseClass(supportFileResponse, 'f');
            const successSupportFileInstance = new SupportFileResponseClass(supportFileResponse, 's');
            const instance = errorSupportFileInstance.supportFileObject ? errorSupportFileInstance : successSupportFileInstance;
            return instance.supportFileObject.timestamp;
        }, [supportFileResponse])
        useEffect(() => {
            switch (deletingSupportFile) {
                case API_REQUEST_STATE.FINISH:
                case API_REQUEST_STATE.ERROR:
                    if(isDeleting) {
                        setIsDeleting(false);
                    }
                    break;
            }
        }, [deletingSupportFile]);
        return (
            <PermissionTooltipButton
                hasConfirmation
                confirmationText={'Do you really want to delete?'}
                isLoading={isDeleting}
                target={`delete_entity_${supportFileTimeStamp.toString()}`}
                position={'top'}
                tooltip={'Delete'}
                hasBackground={false}
                handleClick={deleteFile}
                icon={'delete'}
                size={TextSize.Size_20}
                permission={ConnectionPermissions.DELETE}
            />
        )
    }

DeleteSupportFile.defaultProps = {
}


export {
    DeleteSupportFile,
};

export default withTheme(DeleteSupportFile);

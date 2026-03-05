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

import React, {FC, useEffect, useState} from 'react';
import {withTheme} from 'styled-components';
import {DeleteSupportFilesProps} from './interfaces';
import {RootState, useAppDispatch, useAppSelector} from "@application/utils/store";
import {TextSize} from "@app_component/base/text/interfaces";
import {PermissionButton, PermissionTooltipButton} from "@app_component/base/button/PermissionButton";
import {ConnectionPermissions} from "@entity/connection/constants";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {
    deleteSupportFiles,
} from "@root/redux_toolkit/action_creators/SupportFileCreators";



const DeleteSupportFiles: FC<DeleteSupportFilesProps> =
    ({
        supportFilesResponses,
        isDisabled,
    }) => {
        const dispatch = useAppDispatch();
        const {deletingSupportFiles} = useAppSelector((state: RootState) => state.supportFileReducer);
        const [isDeleting, setIsDeleting] = useState<boolean>(false);
        const deleteFile = () => {
            setIsDeleting(true);
            dispatch(deleteSupportFiles({filenames: supportFilesResponses.map(f => f.supportFile.split("/").pop())}));
        }
        useEffect(() => {
            switch (deletingSupportFiles) {
                case API_REQUEST_STATE.FINISH:
                case API_REQUEST_STATE.ERROR:
                    if(isDeleting) {
                        setIsDeleting(false);
                    }
                    break;
            }
        }, [deletingSupportFiles]);
        return (
            <PermissionButton
                id={'support-file-list-delete-selected'}
                isDisabled={isDisabled}
                hasConfirmation
                confirmationText={'Do you really want to delete?'}
                isLoading={isDeleting}
                position={'top'}
                handleClick={deleteFile}
                icon={'delete'}
                label={'Delete Selected'}
                permission={ConnectionPermissions.DELETE}
            />
        )
    }

DeleteSupportFiles.defaultProps = {
}


export {
    DeleteSupportFiles,
};

export default withTheme(DeleteSupportFiles);

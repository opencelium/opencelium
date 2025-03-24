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
import {DownloadSupportFileProps} from './interfaces';
import {RootState, useAppDispatch, useAppSelector} from "@application/utils/store";
import {TextSize} from "@app_component/base/text/interfaces";
import {PermissionTooltipButton} from "@app_component/base/button/PermissionButton";
import {ConnectionPermissions} from "@entity/connection/constants";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {downloadSupportFile} from "@root/redux_toolkit/action_creators/SupportFileCreators";



const DownloadSupportFile: FC<DownloadSupportFileProps> =
    ({
         supportFileResponse,
     }) => {
        const dispatch = useAppDispatch();
        const {downloadingSupportFile} = useAppSelector((state: RootState) => state.supportFileReducer);
        const [isDownloading, setIsDownloading] = useState<boolean>(false);
        const download = () => {
            setIsDownloading(true);
            dispatch(downloadSupportFile({connectionId: supportFileResponse.connectionId, zipFileName: supportFileResponse.supportFile}));
        }
        useEffect(() => {
            switch (downloadingSupportFile) {
                case API_REQUEST_STATE.FINISH:
                case API_REQUEST_STATE.ERROR:
                    if(isDownloading) {
                        setIsDownloading(false);
                    }
                    break;
            }
        }, [downloadingSupportFile]);
        return (
            <PermissionTooltipButton
                isLoading={isDownloading}
                target={`download_${supportFileResponse.connectionId.toString()}`}
                position={'top'}
                tooltip={'Download'}
                hasBackground={false}
                handleClick={download}
                icon={'download'}
                size={TextSize.Size_20}
                permission={ConnectionPermissions.UPDATE}
            />
        )
    }

DownloadSupportFile.defaultProps = {
}


export {
    DownloadSupportFile,
};

export default withTheme(DownloadSupportFile);

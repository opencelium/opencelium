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
import { DownloadIconProps } from './interfaces';
import { DownloadIconStyled } from './styles';
import {RootState, useAppDispatch, useAppSelector} from "@application/utils/store";
import {ColorTheme} from "@style/Theme";
import {TextSize} from "@app_component/base/text/interfaces";
import {PermissionTooltipButton} from "@app_component/base/button/PermissionButton";
import {ConnectionPermissions} from "@entity/connection/constants";
import {getTemplateByConnectionId} from "@entity/template/redux_toolkit/action_creators/TemplateCreators";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";



const DownloadIcon: FC<DownloadIconProps> =
    ({
        listConnection,
    }) => {
    const dispatch = useAppDispatch();
    const {gettingTemplateByConnectionId} = useAppSelector((state: RootState) => state.templateReducer);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const downloadAsTemplate = () => {
        setIsDownloading(true);
        dispatch(getTemplateByConnectionId(listConnection.id));
    }
    useEffect(() => {
        switch (gettingTemplateByConnectionId) {
            case API_REQUEST_STATE.FINISH:
            case API_REQUEST_STATE.ERROR:
                if(isDownloading) {
                    setIsDownloading(false);
                }
                break;
        }
    }, [gettingTemplateByConnectionId]);
    return (
        <DownloadIconStyled >
            <PermissionTooltipButton
                isLoading={isDownloading}
                target={`download_entity_${listConnection.id.toString()}`}
                position={'top'}
                tooltip={'Download as Template'}
                hasBackground={false}
                handleClick={downloadAsTemplate}
                icon={'download'}
                color={ColorTheme.Turquoise}
                size={TextSize.Size_20}
                permission={ConnectionPermissions.UPDATE}
            />
        </DownloadIconStyled>
    )
}

DownloadIcon.defaultProps = {
}


export {
    DownloadIcon,
};

export default withTheme(DownloadIcon);

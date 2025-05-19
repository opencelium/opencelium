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
import {getActionWithoutType} from "@application/utils/utils";
import LinkMessage from "@app_component/base/link_message/LinkMessage";
import {InterpolateTranslation} from "@app_component/base/interpolate_translation/InterpolateTranslation";
import {notifyAboutNewSupportFile} from "@root/redux_toolkit/slices/SupportFileSlice";

const NOTIFY_NEW_SUPPORT_FILE = (responseType, dispatch, navigate, params) => {
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${notifyAboutNewSupportFile.type}`}>
            The new <LinkMessage dispatch={dispatch} navigate={navigate} link={'support_files'} message={"support file"}/> was generated successfully.
        </InterpolateTranslation>
    );
}
export default {
    [getActionWithoutType(notifyAboutNewSupportFile.type)]: NOTIFY_NEW_SUPPORT_FILE,
}

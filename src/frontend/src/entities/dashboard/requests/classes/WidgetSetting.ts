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

import {AxiosResponse} from "axios";
import Request from "@entity/application/requests/classes/Request";
import {IRequestSettings} from "@application/requests/interfaces/IRequest";
import {IWidgetSettingRequest, WidgetSettingsProps} from "../interfaces/IWidgetSetting";


export class WidgetSettingRequest extends Request implements IWidgetSettingRequest{

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'widget_setting', ...settings});
    }

    async getAllWidgetSettingsByUserId(): Promise<AxiosResponse<WidgetSettingsProps>>{
        return super.get<WidgetSettingsProps>();
    }

    async updateAllWidgetSettings(widgetSettings: WidgetSettingsProps): Promise<AxiosResponse<WidgetSettingsProps>>{
        return super.post<WidgetSettingsProps>(widgetSettings);
    }
}
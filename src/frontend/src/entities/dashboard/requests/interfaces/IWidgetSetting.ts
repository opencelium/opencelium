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
import {IWidgetSetting} from "../../interfaces/IWidgetSetting";

export interface WidgetSettingsProps{
    userId: number,
    widgetSettings: IWidgetSetting[],
}

export const DefaultWidgetSettings: IWidgetSetting[] = [
    {
        x: 0,
        y: 6,
        w: 6,
        h: 4,
        minW: 6,
        minH: 4,
        widgetId: 1,
        i: 'CONNECTION_OVERVIEW',
    },{
        x: 0,
        y: 2,
        w: 6,
        h: 4,
        minW: 6,
        minH: 4,
        widgetId: 4,
        i: 'SUBSCRIPTION_OVERVIEW',
    }, {
        x: 0,
        y: 0,
        w: 12,
        h: 2,
        minW: 12,
        minH: 2,
        widgetId: 5,
        i: 'METRICS_OVERVIEW',
    }, {
        x: 6,
        y: 2,
        w: 6,
        h: 4,
        minW: 6,
        minH: 4,
        widgetId: 2,
        i: 'CURRENT_SCHEDULER'
    }
]

export interface IWidgetSettingRequest{

    //to get all widget settings by user id
    getAllWidgetSettingsByUserId(): Promise<AxiosResponse<WidgetSettingsProps>>,

    //to update widget settings of authorized user
    updateAllWidgetSettings(widgetSettings: WidgetSettingsProps): Promise<AxiosResponse<WidgetSettingsProps>>,
}

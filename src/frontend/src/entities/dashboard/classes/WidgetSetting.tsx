/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import {useAppSelector} from "@application/utils/redux";
import {RootState} from "@application/utils/store";
import {IWidgetSetting} from "../interfaces/IWidgetSetting";
import {WidgetKey} from "../interfaces/IWidget";

export class WidgetSetting implements IWidgetSetting{
    widgetId: number = 0;
    widgetSettingId: number = 0;
    x: number = 0;
    y: number = 0;
    w: number = 0;
    h: number = 0;
    i: WidgetKey;
    minH: number = 0;
    minW: number = 0;

    constructor(widgetSetting?: Partial<IWidgetSetting>) {
        this.widgetId = widgetSetting?.widgetId || 0;
        this.widgetSettingId = widgetSetting?.widgetSettingId || 0;
        this.x = widgetSetting?.x || 0;
        this.y = widgetSetting?.y || 0;
        this.w = widgetSetting?.w || 0;
        this.h = widgetSetting?.h || 0;
        this.i = widgetSetting?.i;
        this.minH = widgetSetting?.minH || 0;
        this.minW = widgetSetting?.minW || 0;
    }

    static getReduxState(){
        return useAppSelector((state: RootState) => state.widgetSettingReducer);
    }
}
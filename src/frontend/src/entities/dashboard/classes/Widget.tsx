/*
 *  Copyright (C) <2022>  <becon GmbH>
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

import {useAppSelector} from "@application/utils/store";
import {RootState} from "@application/utils/store";
import {IWidget, WidgetKey} from "../interfaces/IWidget";

export class Widget implements IWidget{
    widgetId: number = 0;
    i: WidgetKey;
    icon: string = '';
    tooltipTranslationKey: string = '';

    constructor(widget?: Partial<IWidget>) {
        this.widgetId = widget?.widgetId || 0;
        this.i = widget?.i;
        this.icon = widget?.icon || '';
        this.tooltipTranslationKey = widget?.tooltipTranslationKey || '';
    }

    static getReduxState(){
        return useAppSelector((state: RootState) => state.widgetReducer);
    }
}
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

import {Request} from "../application/Request";
import {AxiosResponse} from "axios";
import {IRequestSettings} from "../../interfaces/application/IRequest";
import {IWidgetRequest} from "../../interfaces/dashboard/IWidget";
import {IWidget} from "@interface/dashboard/IWidget";


export class WidgetRequest extends Request implements IWidgetRequest{

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'widget', ...settings});
    }

    async getAllWidgets(): Promise<AxiosResponse<IWidget[]>>{
        this.endpoint = '/all';
        return super.get<IWidget[]>();
    }
}
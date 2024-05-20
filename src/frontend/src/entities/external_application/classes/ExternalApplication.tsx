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

import {useAppSelector} from "@application/utils/store";
import {RootState} from "@application/utils/store";
import {IExternalApplication} from "../interfaces/IExternalApplication";
import {ExternalApplicationStatus} from "../requests/interfaces/IExternalApplication";

export class ExternalApplication implements IExternalApplication{
    id: number;
    name: string = '';
    link: string = '';
    icon: string = '';
    value: string = '';
    status?: ExternalApplicationStatus = ExternalApplicationStatus.DOWN;
    version?: string = '';

    constructor(externalApplication?: Partial<IExternalApplication>) {
        this.id = externalApplication?.id || 0;
        this.name = externalApplication?.name || '';
        this.link = externalApplication?.link || '';
        this.icon = externalApplication?.icon || '';
        this.value = externalApplication?.value || '';
        this.status = externalApplication?.status || ExternalApplicationStatus.DOWN;
        this.version = externalApplication?.version || '';
    }

    static getReduxState(){
        return useAppSelector((state: RootState) => state.externalApplicationReducer);
    }
}

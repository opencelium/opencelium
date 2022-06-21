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

import {IAdminCard} from "../interfaces/IAdminCard";

// Admin Card class
export class AdminCard implements IAdminCard{

    id: number;

    name: string = '';

    // to open admin card via link
    link: string = '';

    permission?: string = '';

    constructor(adminCard?: IAdminCard) {
        this.id = adminCard?.id || 0;
        this.name = adminCard?.name || '';
        this.link = adminCard?.link || '';
        this.permission = adminCard?.permission || '';
    }
}
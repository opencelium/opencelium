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

import {IAdminCard} from "../interfaces/IAdminCard";

// Admin Card class
export class AdminCard implements IAdminCard{

    id: number;

    name: string = '';

    // to open admin card via link
    link: string = '';

    permission?: string = '';

    isExternalHref?: boolean = false;

    isDisabled?: boolean = false;

    isLoading?: boolean = false;

    title?: string = '';

    constructor(adminCard?: IAdminCard) {
        this.id = adminCard?.id || 0;
        this.name = adminCard?.name || '';
        this.link = adminCard?.link || '';
        this.permission = adminCard?.permission || '';
        this.isExternalHref = adminCard?.isExternalHref || false;
        this.isDisabled = adminCard?.isDisabled || false;
        this.isLoading = adminCard?.isLoading || false;
        this.title = adminCard?.title || '';
    }
}

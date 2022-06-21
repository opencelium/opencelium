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

import {AxiosResponse} from "axios";
import IUser from "@entity/user/interfaces/IUser";
import {ICredentials} from "../../interfaces/IAuth";

interface IAuth{

    //to login into the application
    login(credentials: ICredentials): Promise<AxiosResponse<IUser>>,

    //to logout from the application
    logout(): void,
}

export {
    IAuth,
}
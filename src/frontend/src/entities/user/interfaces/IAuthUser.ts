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

import {IUserGroupFile, IUserGroupText, IUserGroupTextarea} from "@entity/user_group/interfaces/IUserGroup";
import {
    IUserDetailFile,
    IUserDetailRadios,
    IUserDetailSelect, IUserDetailSwitch,
    IUserDetailText
} from "./IUserDetail";

export default interface IAuthUser{
    id: number,
    email: string,
    token: string,
    expTime: number,
    sessionTime: number,
    lastLogin: number,
    userGroup: IUserGroupFile & IUserGroupTextarea & IUserGroupText | any,
    userDetail: IUserDetailText & IUserDetailSelect & IUserDetailRadios & IUserDetailFile & IUserDetailSwitch | any,
    dashboard?: any,
    themes?: string,
    logoName?: string,
}
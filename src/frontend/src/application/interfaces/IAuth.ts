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

import {JwtPayload} from "jsonwebtoken";

import {IForm} from "../interfaces/core";

export interface ICredentials{
    email: string,
    password: string,
}

export interface LogoutProps{
    wasAccessDenied?: boolean,
    message?: string,
}

export interface TokenProps extends JwtPayload{
    role: string,
    sessionTime: string,
    userId: number,
}


export interface IAuthText{
    username: string;
    password: string;
}


export interface IAuthForm extends IAuthText, IForm<IAuthText, {}, {}, {}, {}, {}>{
    login: () => boolean;
}

export interface IAuth extends IAuthForm{
}

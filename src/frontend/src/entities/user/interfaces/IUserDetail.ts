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

import {IForm} from "@application/interfaces/core";
import { UserTitle } from "../requests/models/UserDetail";

export interface IUserDetailSwitch{
    appTour: boolean,
    themeSync?: boolean,
}

export interface IUserDetailFile{
    profilePictureFile: FileList;
}
export interface IUserDetailTextarea{
}

export interface IUserDetailSelect{
}

export interface IUserDetailRadios{
    userTitle: UserTitle;
    theme: string,
}

export interface IUserDetailText{
    name: string;
    surname: string;
    phoneNumber: string;
    department: string;
    organization: string;
}


export interface IUserDetailForm extends IUserDetailText, IUserDetailSelect, IUserDetailRadios, IUserDetailFile, IUserDetailSwitch, IForm<IUserDetailText, IUserDetailSelect, IUserDetailRadios, IUserDetailFile, IUserDetailTextarea, IUserDetailSwitch>{

}
export default interface IUserDetail extends IUserDetailForm{
    profilePicture?: string,
    shouldDeletePicture?: boolean,
}


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

import {AxiosResponse} from "axios";
import Request from "@entity/application/requests/classes/Request";
import IUserDetail from "../../interfaces/IUserDetail";
import IUserDetailRequest from "../interfaces/IUserDetailRequest";
import {IRequestSettings} from "@application/requests/interfaces/IRequest";
import {use} from "i18next";

export default class UserDetailRequest extends Request implements IUserDetailRequest{

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'userDetail', ...settings});
    }

    async updateUserDetail(userDetail: Partial<IUserDetail>): Promise<AxiosResponse<IUserDetail>>{
        return super.put<IUserDetail>(UserDetailRequest.backendMap(userDetail));
    }

    static backendMap(userDetail: Partial<IUserDetail>){
        return {
            appTour: userDetail.appTour,
            department: userDetail.department,
            lang: "eng",
            name: userDetail.name,
            organization: userDetail.organization,
            phoneNumber: userDetail.phoneNumber,
            profilePicture: userDetail.profilePicture,
            surname: userDetail.surname,
            theme: userDetail.theme,
            userTitle: userDetail.userTitle,
            themeSync: userDetail.themeSync,
        };
    }
}
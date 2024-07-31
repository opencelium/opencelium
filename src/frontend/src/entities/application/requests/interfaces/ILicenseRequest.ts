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
import LicenseModel from "@entity/application/requests/models/LicenseModel";

export interface ActivateLicenseFileRequest {

}
export interface ActivateLicenseStringRequest {
    licenseKey: string,
}
export interface ActivateLicenseResponse {
    license: LicenseModel,
}

export interface GetStatusResponse {
    status: boolean,
}

export default interface ILicenseRequest {

    //to activate license file
    activateFile (data: ActivateLicenseFileRequest): Promise<AxiosResponse<ActivateLicenseResponse>>,

    //to activate license string
    activateString (data: ActivateLicenseStringRequest): Promise<AxiosResponse<ActivateLicenseResponse>>,

    //to get status
    getStatus (): Promise<AxiosResponse<GetStatusResponse>>

}

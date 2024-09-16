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
import {StatusResponse} from "@application/requests/interfaces/IApplication";
import LicenseModel, {
    ActivationRequestStatus,
    LicenseListItem
} from "@entity/license_management/requests/models/LicenseModel";
import {IResponse} from "@application/requests/interfaces/IResponse";
import SubscriptionModel from "@entity/license_management/requests/models/SubscriptionModel";

export interface ActivateLicenseFileRequest {

}
export interface ActivateLicenseStringRequest {
    licenseKey: string,
}
export interface ActivateLicenseResponse {
    license: LicenseModel,
}

export interface GenerateActivateRequestResponse {
    request: string,
}
export interface GetActivationRequestStatusResponse {
    status: ActivationRequestStatus,
}

export default interface ILicenseRequest {

    //to get all licenses (in online mode)
    getLicenseList (): Promise<AxiosResponse<LicenseListItem[]>>,

    //to generate activate request (in offline mode)
    generateActivateRequest (): Promise<AxiosResponse<GenerateActivateRequestResponse>>,

    //to activate license file (in offline mode)
    activateFile (data: ActivateLicenseFileRequest): Promise<AxiosResponse<ActivateLicenseResponse>>,

    //to activate license string (in offline mode)
    activateString (data: ActivateLicenseStringRequest): Promise<AxiosResponse<ActivateLicenseResponse>>,

    //to get status
    getStatus (): Promise<AxiosResponse<StatusResponse>>,

    //to get activation request status
    getActivationRequestStatus (): Promise<AxiosResponse<GetActivationRequestStatusResponse>>,

    //to delete license
    deleteLicense (): Promise<AxiosResponse<IResponse>>,

}

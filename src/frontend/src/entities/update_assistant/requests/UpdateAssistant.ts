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

import Request from "@entity/application/requests/classes/Request";
import {AxiosResponse} from "axios";
import {IUpdateAssistantRequest, OnlineUpdateProps, OfflineUpdateProps} from "@application/requests/interfaces/IUpdateAssistant";
import {IRequestSettings} from "@application/requests/interfaces/IRequest";
import {IResponse} from "@application/requests/interfaces/IResponse";
import {onlineApiServerOpenCeliumUrl} from "@entity/application/requests/classes/url";
import {generateSignature} from "@application/utils/utils";


export class UpdateAssistantRequest extends Request implements IUpdateAssistantRequest{

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'assistant/oc', ...settings});
    }

    async getUpdatesFromServicePortal(currentVersion: string): Promise<AxiosResponse<OnlineUpdateProps[]>>{
        this.isFullUrl = true;
        const currentDate = `${+ new Date()}`;
        const endpoint = `p984zhugh3443g8-438ghi4uh34g83-03ugoigh498t53y-483hy4pgh438ty3948gh34p8g-34ug394gheklrghdgopwuew09327-89f/${currentVersion}`;
        this.url = `${onlineApiServerOpenCeliumUrl}${endpoint}`;
        return super.get<OnlineUpdateProps[]>({
            headers: {
                'x-access-token': 'qpoeqavncbms09248527qrkazmvbgw9328uq0akzvzncbjgwh3pw09r0iavlhgwe98y349t8ghergiueh49230ur29ut3hg9',
                'x-sp-timestamp': currentDate,
                'x-sp-signature': generateSignature('tp2wwig91eo7kh2sa3rgsas3apw81uw3sdw9t8wigjvmdvcv', 'GET', `/${endpoint}`, currentDate)
            }
        });
    }

    async getOnlineUpdates(): Promise<AxiosResponse<OnlineUpdateProps[]>>{
        this.endpoint = '/online/versions';
        return super.get<OnlineUpdateProps[]>();
    }

    async getOfflineUpdates(): Promise<AxiosResponse<OfflineUpdateProps[]>>{
        this.endpoint = '/offline/versions';
        return super.get<OfflineUpdateProps[]>();
    }

    async uploadApplicationFile(application: FormData): Promise<AxiosResponse<IResponse>>{
        this.url = 'storage/assistant/zipfile';
        return super.post<IResponse>(application);
    }

    async deleteApplicationFile(): Promise<AxiosResponse<IResponse>>{
        this.url = 'storage/assistant/zipfile';
        return super.delete<IResponse>();
    }

    async checkApplicationBeforeUpdate(): Promise<AxiosResponse<IResponse>>{
        this.endpoint = '/restart/file/exists';
        return super.get<IResponse>();
    }

    async updateApplication(data: any): Promise<AxiosResponse<IResponse>>{
        this.endpoint = '/migrate';
        return super.post<IResponse>(data);
    }
}
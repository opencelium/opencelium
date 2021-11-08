/*
 * Copyright (C) <2021>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import {AdminCardsAction} from '@utils/actions';
import {
    fetchAdminCardsFulfilled, fetchAdminCardsRejected,
    loadAdminCardsLinkFulfilled, loadAdminCardsLinkRejected,
} from '@actions/admin_cards/fetch';
import {doRequest} from "@utils/auth";
import {invokerUrl, appUrl} from "@utils/constants/url";
import {
    AppPermissions,
    InvokerPermissions, NO_NEED_PERMISSION, NotificationTemplatePermissions,
    TemplatePermissions,
    UserGroupPermissions,
    UserPermissions
} from "@utils/constants/permissions";


const adminCards = [
    {id: 1, name: 'Users', link: '/users', permission: UserPermissions.READ},
    {id: 2, name: 'Groups', link: '/usergroups', permission: UserGroupPermissions.READ},
    {id: 3, name: 'App', link: '/apps', permission: AppPermissions.READ},
    {id: 4, name: 'Invokers', link: '/invokers', permission: InvokerPermissions.READ},
    {id: 5, name: 'Templates', link: '/templates', permission: TemplatePermissions.READ},
    {id: 6, name: 'Converter', link: '/template_converter'},
    {id: 7, name: 'Notification Templates', link: '/notification_templates', permission: NotificationTemplatePermissions.READ},
    {id: 8, name: 'Update Assistant', link: '/update_assistant'},
    {id: 9, name: 'Subscription Update', link: '/update_subscription'},
];

/**
 * main url for applications
 */
const urlPrefix = 'admin_cards';

/**
 * fetch all applications
 *
 * @param action$ - catch the state of the app
 * @param store - from redux
 * returns promise depending on the result of request
 */
const fetchAdminCardsEpic = (action$, store) => {
    return action$.ofType(AdminCardsAction.FETCH_ADMINCARDS)
        .debounceTime(500)
        .mergeMap((action) => {
            /*let url = `${urlPrefix}/all`;1
            return doRequest({url},{
                success: (data) => fetchAdminCardsFulfilled(data, action.settings),
                reject: fetchAppsRejected,
            });*/
            return fetchAdminCardsFulfilled(adminCards, action.settings);
        });
};

const loadAdminCardsLinkEpic = (action$, store) => {
    return action$.ofType(AdminCardsAction.LOAD_ADMINCARD)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = action.payload.link;
            return doRequest({fullUrl: true, url}, {
                success: loadAdminCardsLinkFulfilled,
                reject: loadAdminCardsLinkRejected,
            });
        });
};



export {
    fetchAdminCardsEpic,
    loadAdminCardsLinkEpic,
};
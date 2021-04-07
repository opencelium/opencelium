
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
/**
 * application constants
 */

export const OC_NAME = 'OpenCelium';
export const OC_DESCRIPTION = 'OpenCelium is super duper hub';
export const isProd = process.env.NODE_ENV === 'production';
export const isDev = process.env.NODE_ENV === 'development';
export const Roles = {
    USER: 'ROLE_USER',
    ADMIN: 'ROLE_ADMIN'
};

export const Request = {
    REJECTED: 'Server problems. The request was rejected.',
    CANCELED: 'The request was canceled.'
};
export const Permissions = ['CREATE', 'READ', 'UPDATE', 'DELETE'];
export const AppSettings = {
    i18nDebug: isDev,
    reduxHasLogs: isDev,
};

export const ERROR_TYPE = {
    FRONTEND: 'FRONTEND',
    BACKEND: 'BACKEND',
};


export const SOCKET_IS_ON = false;

export const ENABLE_VOICE_CONTROL = false;

export const ENABLE_DEBUG_VOICE_CONTROL = false;

export const API_REQUEST_STATE = {
    INITIAL:    -1,
    START:      0,
    FINISH:     1,
    ERROR:      2,
    PAUSE:      3,
};

export const NO_DATA = '-';

export const API_METHOD = {
    POST: 'POST',
    GET: 'GET',
    PUT: 'PUT',
    DELETE: 'DELETE'
};



export const PANEL_LOCATION = {
    NEW_WINDOW: 'new_window',
    SAME_WINDOW: 'same_window',
};

export const SEPARATE_WINDOW = {
    CONNECTION_OVERVIEW:{
        DETAILS: 'connection_overview_details',
        LAYOUT: 'connection_overview_layout',
    }
}

export const TEST = {"templateId":"10fef2af-9f50-4242-b35b-0c66b31a56d9","name":"jiratrello","description":"","license":null,"version":"1.3","connection":{"nodeId":null,"connectionId":null,"title":"Jira2Trello - Issues","description":"","fromConnector":{"nodeId":null,"connectorId":3,"title":null,"invoker":{"name":"jira"},"methods":[{"name":"issues","request":{"endpoint":"{url}/rest/api/3/search?jql=project=\"OC\"","body":null,"method":"GET"},"response":{"success":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"issues":[{"id":"","fields":{"summary":"","statuscategorychangedate":"","components":[{"name":""}],"timespent":"","timeoriginalestimate":"","description":{"content":[{"content":[{"text":""}]}]},"fixVersions":[{"name":""}],"aggregatetimespent":"","labels":[],"aggregatetimeestimate":"","versions":[{"name":""}],"assignee":{"displayName":""},"status":{"name":"","id":""}},"key":""}]}}},"fail":{"status":"400","body":null}},"index":"0","color":"#FFCFB5"}],"operators":[]},"toConnector":{"nodeId":null,"connectorId":5,"title":null,"invoker":{"name":"trello"},"methods":[{"name":"GetBoards","request":{"endpoint":"{url}/1/members/{username}/boards?key={key}&token={token}","body":null,"method":"GET"},"response":{"success":{"status":"200","body":{"type":"array","format":"json","data":"raw","fields":{"name":"","id":""}}},"fail":{"status":"401","body":null}},"index":"0","color":"#C77E7E"},{"name":"AddBoard","request":{"endpoint":"{url}/1/boards?key={key}&token={token}&defaultLists=false&name=OC","body":null,"method":"POST"},"response":{"success":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"id":""}}},"fail":{"status":"400","body":null}},"index":"1_0","color":"#6477AB"},{"name":"GetBoardList","request":{"endpoint":"{url}/1/boards/{%#6477AB.(response).success.id%}/lists?key={key}&token={token}","body":null,"method":"GET"},"response":{"success":{"status":"200","body":{"type":"array","format":"json","data":"raw","fields":{"subscribed":"","idBoard":"","pos":"","name":"","closed":"","id":"","softLimit":""}}},"fail":{"status":"400","body":null}},"index":"1_1_0","color":"#98BEC7"},{"name":"AddList","request":{"endpoint":"{url}/1/boards/{%#6477AB.(response).success.id%}/lists?key={key}&token={token}&name={%#FFCFB5.(response).success.issues[].fields.status.name%}","body":null,"method":"POST"},"response":{"success":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"id":""}}},"fail":{"status":"400","body":null}},"index":"1_1_1_0","color":"#E6E6EA"},{"name":"AddCard","request":{"endpoint":"{url}/1/cards?key={key}&token={token}&idList={%#E6E6EA.(response).success.id%}&name={%#FFCFB5.(response).success.issues[].key%}:{%#FFCFB5.(response).success.issues[].fields.summary%}&desc={%#FFCFB5.(response).success.issues[].fields.description.content[0].content[0].text%} ","body":null,"method":"POST"},"response":{"success":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"dateLastActivity":"","id":""}}},"fail":{"status":"400","body":null}},"index":"1_1_1_1","color":"#F4B6C2"},{"name":"AddCard","request":{"endpoint":"{url}/1/cards?key={key}&token={token}&idList={%#98BEC7.(response).success.[i].id%}&name={%#FFCFB5.(response).success.issues[].key%}:{%#FFCFB5.(response).success.issues[].fields.summary%}&desc={%#FFCFB5.(response).success.issues[].fields.description.content[0].content[0].text%} ","body":null,"method":"POST"},"response":{"success":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"dateLastActivity":"","id":""}}},"fail":{"status":"400","body":null}},"index":"1_1_2_0_0_0","color":"#9EC798"},{"name":"SearchInBoard","request":{"endpoint":"{url}/1/search?idBoard={%#C77E7E.(response).success.[i].id%}&key={key}&token={token}&query={%#FFCFB5.(response).success.issues[].key%} ","body":null,"method":"GET"},"response":{"success":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"cards":[{"name":"","id":""}]}}},"fail":{"status":"401","body":null}},"index":"2_0_0_0_0","color":"#BFC798"}],"operators":[{"index":"1","type":"if","condition":{"leftStatement":{"color":"#C77E7E","field":"success.[*]","type":"response","rightPropertyValue":""},"relationalOperator":"NotContains","rightStatement":{"color":"","field":"OC","rightPropertyValue":"name","type":""}},"iterator":null},{"index":"1_1","type":"loop","condition":{"leftStatement":{"color":"#FFCFB5","field":"success.issues[]","type":"response","rightPropertyValue":""},"relationalOperator":"","rightStatement":null},"iterator":"i"},{"index":"1_1_1","type":"if","condition":{"leftStatement":{"color":"#98BEC7","field":"success.[*]","type":"response","rightPropertyValue":""},"relationalOperator":"NotContains","rightStatement":{"color":"#FFCFB5","field":"success.issues[].fields.status.name","type":"response","rightPropertyValue":"name"}},"iterator":null},{"index":"1_1_2","type":"if","condition":{"leftStatement":{"color":"#98BEC7","field":"success.[*]","type":"response","rightPropertyValue":""},"relationalOperator":"Contains","rightStatement":{"color":"#FFCFB5","field":"success.issues[].fields.status.name","type":"response","rightPropertyValue":"name"}},"iterator":null},{"index":"1_1_2_0","type":"loop","condition":{"leftStatement":{"color":"#98BEC7","field":"success.[*]","type":"response","rightPropertyValue":""},"relationalOperator":"","rightStatement":null},"iterator":"i"},{"index":"1_1_2_0_0","type":"if","condition":{"leftStatement":{"color":"#98BEC7","field":"success.[i].name","type":"response","rightPropertyValue":""},"relationalOperator":"=","rightStatement":{"color":"#FFCFB5","field":"success.issues[].fields.status.name","type":"response","rightPropertyValue":""}},"iterator":null},{"index":"2","type":"if","condition":{"leftStatement":{"color":"#C77E7E","field":"success.[*]","type":"response","rightPropertyValue":""},"relationalOperator":"Contains","rightStatement":{"color":"","field":"OC","rightPropertyValue":"name","type":""}},"iterator":null},{"index":"2_0","type":"loop","condition":{"leftStatement":{"color":"#C77E7E","field":"success.[*]","type":"response","rightPropertyValue":""},"relationalOperator":"","rightStatement":null},"iterator":"i"},{"index":"2_0_0","type":"if","condition":{"leftStatement":{"color":"#C77E7E","field":"success.[i].name","type":"response","rightPropertyValue":""},"relationalOperator":"=","rightStatement":{"color":"","field":"OC","rightPropertyValue":"","type":""}},"iterator":null},{"index":"2_0_0_0","type":"loop","condition":{"leftStatement":{"color":"#FFCFB5","field":"success.issues[]","type":"response","rightPropertyValue":""},"relationalOperator":"","rightStatement":null},"iterator":"i"}]},"fieldBinding":[]}};
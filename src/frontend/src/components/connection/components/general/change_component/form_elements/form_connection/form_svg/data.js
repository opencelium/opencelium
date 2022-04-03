 


/*
 * Copyright (C) <2022>  <becon GmbH>
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

import {sortByIndex} from "@utils/app";

const CONNECTION_TEMPLATE = {"templateId":"8e9d0c17-0769-49c2-9261-17ab6650f45c","version":"1.3","name":"idoit.create/update","description":"Create/update an object. The fields name, incident_state and vendor are used for the import. All objects are saved as a 'client', object type. The identifier field is an object title.","license":"SEE LICENSE IN 'PROJECTDIR/src/backend/src/main/resources/templates/LICENSE'","connection":{"title":"otrs.idoit.create/update","description":"","fromConnector":{"connectorId":28,"invoker":{"name":"otrs","links":[]},"methods":[{"nodeId":null,"index":"0","name":"ConfigItemSearch","color":"#FFCFB5","request":{"nodeId":null,"endpoint":"{url}/{WebService}/ConfigItemSearch/{UserLogin}/{Password}","method":"POST","header":null,"body":{"data":"raw","format":"json","type":"array","fields":{"ConfigItem":{"OrderBy":["Name"],"InciState":"","Number":"","DeplState":"","Class":"Hardware","Name":""}}},"links":[]},"response":{"nodeId":null,"name":"response","success":{"nodeId":null,"status":"200","header":null,"body":{"data":"raw","format":"json","type":"array","fields":{"ConfigItemIDs":[]}},"links":[]},"fail":{"nodeId":null,"status":"200","header":null,"body":{"data":"raw","format":"json","type":"array","fields":{"Error":{"ErrorCode":"","ErrorMessage":""}}},"links":[]},"links":[]},"links":[]},{"nodeId":null,"index":"1_0","name":"ConfigItemGet","color":"#C77E7E","request":{"nodeId":null,"endpoint":"{url}/{WebService}/ConfigItemGet/{UserLogin}/{Password}","method":"POST","header":null,"body":{"data":"raw","format":"json","type":"array","fields":{"ConfigItemID":"#FFCFB5.(response).success.ConfigItemIDs[]"}},"links":[]},"response":{"nodeId":null,"name":"response","success":{"nodeId":null,"status":"200","header":null,"body":{"data":"raw","format":"json","type":"array","fields":{"ConfigItem":[{"InciState":"","Number":"","DeplState":"","Class":"","CIXMLData":{"Vendor":""},"Name":""}]}},"links":[]},"fail":{"nodeId":null,"status":"500","header":null,"body":{"data":"raw","format":"json","type":"array","fields":{"faultstring":"","faultcode":""}},"links":[]},"links":[]},"links":[]}],"operators":[{"nodeId":null,"type":"if","index":"1","condition":{"relationalOperator":"NotEmpty","leftStatement":{"color":"#FFCFB5","field":"success.ConfigItemIDs[]","type":"response","rightPropertyValue":"","links":[]},"rightStatement":null,"links":[]},"links":[]}],"links":[]},"toConnector":{"connectorId":27,"invoker":{"name":"i-doit","links":[]},"methods":[{"nodeId":null,"index":"0_0_0","name":"cmdb.objects.read","color":"#6477AB","request":{"nodeId":null,"endpoint":"{url}","method":"POST","header":null,"body":{"data":"raw","format":"json","type":"array","fields":{"method":"cmdb.objects.read","id":"1","params":{"filter":{"sys_id":"","firstname":"","ids":[],"type_title":"","type":["10"],"title":"#C77E7E.(response).success.ConfigItem[].Name","email":"","lastname":""},"apikey":"{apikey}","limit":"","order_by":"","language":"","sort":""},"version":"2.0"}},"links":[]},"response":{"nodeId":null,"name":"response","success":{"nodeId":null,"status":"200","header":null,"body":{"data":"raw","format":"json","type":"array","fields":{"result":[{"cmdb_status_title":"","image":"","sysid":"","created":"","type_title":"","id":"","cmdb_status":"","title":"","type":"","updated":"","type_group_title":"","status":""}],"id":"","jsonrpc":""}},"links":[]},"fail":{"nodeId":null,"status":"200","header":null,"body":{"data":"raw","format":"json","type":"array","fields":{"error":{"code":"","data":"","message":""}}},"links":[]},"links":[]},"links":[]},{"nodeId":null,"index":"0_0_1_0","name":"cmdb.object.create","color":"#BFC798","request":{"nodeId":null,"endpoint":"{url}","method":"POST","header":null,"body":{"data":"raw","format":"json","type":"array","fields":{"method":"cmdb.object.create","id":"1","params":{"apikey":"{apikey}","language":"","cmdb_status":"#C77E7E.(response).success.ConfigItem[].InciState","type":"10","title":"#C77E7E.(response).success.ConfigItem[].Name"},"version":"2.0"}},"links":[]},"response":{"nodeId":null,"name":"response","success":{"nodeId":null,"status":"200","header":null,"body":{"data":"raw","format":"json","type":"array","fields":{"result":{"id":"","message":"","status":""},"id":"","jsonrpc":""}},"links":[]},"fail":{"nodeId":null,"status":"200","header":null,"body":{"data":"raw","format":"json","type":"array","fields":{"error":{"code":"","data":"","message":""}}},"links":[]},"links":[]},"links":[]},{"nodeId":null,"index":"0_0_1_1_0","name":"cmdb.category.create","color":"#E6E6EA","request":{"nodeId":null,"endpoint":"{url}","method":"POST","header":null,"body":{"data":"raw","format":"json","type":"array","fields":{"method":"cmdb.category.create","id":"1","params":{"data":{"manufacturer":"#C77E7E.(response).success.ConfigItem[].CIXMLData.Vendor"},"apikey":"{apikey}","objID":"#BFC798.(response).success.result.id","language":"","category":"C__CATG__MODEL"},"version":"2.0"}},"links":[]},"response":{"nodeId":null,"name":"response","success":{"nodeId":null,"status":"200","header":null,"body":{"data":"raw","format":"json","type":"array","fields":{"result":[{"id":"","message":""}]}},"links":[]},"fail":{"nodeId":null,"status":"200","header":null,"body":{"data":"raw","format":"json","type":"array","fields":{"error":{"code":"","data":"","message":""}}},"links":[]},"links":[]},"links":[]},{"nodeId":null,"index":"0_0_2_0","name":"cmdb.category.update","color":"#9EC798","request":{"nodeId":null,"endpoint":"{url}","method":"POST","header":null,"body":{"data":"raw","format":"json","type":"array","fields":{"method":"cmdb.category.update","id":"1","params":{"data":{"cmdb_status":"#C77E7E.(response).success.ConfigItem[].InciState"},"apikey":"{apikey}","language":"","category":"C__CATG__GLOBAL","objID":"#6477AB.(response).success.result[]"},"version":"2.0"}},"links":[]},"response":{"nodeId":null,"name":"response","success":{"nodeId":null,"status":"200","header":null,"body":{"data":"raw","format":"json","type":"array","fields":{"result":[{"hostname":"","objID":"","id":""}]}},"links":[]},"fail":{"nodeId":null,"status":"200","header":null,"body":{"data":"raw","format":"json","type":"array","fields":{"error":{"code":"","data":"","message":""}}},"links":[]},"links":[]},"links":[]},{"nodeId":null,"index":"0_0_2_1","name":"cmdb.category.update","color":"#98BEC7","request":{"nodeId":null,"endpoint":"{url}","method":"POST","header":null,"body":{"data":"raw","format":"json","type":"array","fields":{"method":"cmdb.category.update","id":"1","params":{"data":{"manufacturer":"#C77E7E.(response).success.ConfigItem[].CIXMLData.Vendor"},"apikey":"{apikey}","objID":"#6477AB.(response).success.result[]","language":"","category":"C__CATG__MODEL"},"version":"2.0"}},"links":[]},"response":{"nodeId":null,"name":"response","success":{"nodeId":null,"status":"200","header":null,"body":{"data":"raw","format":"json","type":"array","fields":{"result":[{"hostname":"","objID":"","id":""}]}},"links":[]},"fail":{"nodeId":null,"status":"200","header":null,"body":{"data":"raw","format":"json","type":"array","fields":{"error":{"code":"","data":"","message":""}}},"links":[]},"links":[]},"links":[]}],"operators":[{"nodeId":null,"type":"if","index":"0","condition":{"relationalOperator":"NotEmpty","leftStatement":{"color":"#FFCFB5","field":"success.ConfigItemIDs[]","type":"response","rightPropertyValue":"","links":[]},"rightStatement":null,"links":[]},"links":[]},{"nodeId":null,"type":"loop","index":"0_0","condition":{"relationalOperator":"","leftStatement":{"color":"#C77E7E","field":"success.ConfigItem[]","type":"response","rightPropertyValue":"","links":[]},"rightStatement":null,"links":[]},"links":[]},{"nodeId":null,"type":"if","index":"0_0_1","condition":{"relationalOperator":"IsEmpty","leftStatement":{"color":"#6477AB","field":"success.result[]","type":"response","rightPropertyValue":"","links":[]},"rightStatement":null,"links":[]},"links":[]},{"nodeId":null,"type":"if","index":"0_0_1_1","condition":{"relationalOperator":"=","leftStatement":{"color":"#BFC798","field":"success.result.message","type":"response","rightPropertyValue":"","links":[]},"rightStatement":{"color":"","field":"Object was successfully created","type":"","rightPropertyValue":"","links":[]},"links":[]},"links":[]},{"nodeId":null,"type":"if","index":"0_0_2","condition":{"relationalOperator":"NotEmpty","leftStatement":{"color":"#6477AB","field":"success.result[]","type":"response","rightPropertyValue":"","links":[]},"rightStatement":null,"links":[]},"links":[]}],"links":[]},"fieldBinding":[{"from":[{"color":"#C77E7E","type":"response","field":"success.ConfigItem[].Name","links":[]}],"enhancement":{"enhanceId":null,"name":"","description":"","expertCode":"RESULT_VAR = VAR_0;","expertVar":"//var RESULT_VAR = #6477AB.(request).params.filter.title;\n//var VAR_0 = #C77E7E.(response).success.ConfigItem[].Name;","simpleCode":null,"language":"js","links":[]},"to":[{"color":"#6477AB","type":"request","field":"params.filter.title","links":[]}],"links":[]},{"from":[{"color":"#C77E7E","type":"response","field":"success.ConfigItem[].Name","links":[]}],"enhancement":{"enhanceId":null,"name":"","description":"","expertCode":"RESULT_VAR = VAR_0;","expertVar":"//var RESULT_VAR = #BFC798.(request).params.title;\n//var VAR_0 = #C77E7E.(response).success.ConfigItem[].Name;","simpleCode":null,"language":"js","links":[]},"to":[{"color":"#BFC798","type":"request","field":"params.title","links":[]}],"links":[]},{"from":[{"color":"#C77E7E","type":"response","field":"success.ConfigItem[].InciState","links":[]}],"enhancement":{"enhanceId":null,"name":"","description":"","expertCode":"if( VAR_0 == \"Operational\"){\n  RESULT_VAR = \"6\";\n}else{\n  RESULT_VAR = \"10\";\n}","expertVar":"//var RESULT_VAR = #BFC798.(request).params.cmdb_status;\n//var VAR_0 = #C77E7E.(response).success.ConfigItem[].InciState;","simpleCode":null,"language":"js","links":[]},"to":[{"color":"#BFC798","type":"request","field":"params.cmdb_status","links":[]}],"links":[]},{"from":[{"color":"#C77E7E","type":"response","field":"success.ConfigItem[].CIXMLData.Vendor","links":[]}],"enhancement":{"enhanceId":null,"name":"","description":"","expertCode":"RESULT_VAR = VAR_0;","expertVar":"//var RESULT_VAR = #E6E6EA.(request).params.data.manufacturer;\n//var VAR_0 = #C77E7E.(response).success.ConfigItem[].CIXMLData.Vendor;","simpleCode":null,"language":"js","links":[]},"to":[{"color":"#E6E6EA","type":"request","field":"params.data.manufacturer","links":[]}],"links":[]},{"from":[{"color":"#BFC798","type":"response","field":"success.result.id","links":[]}],"enhancement":{"enhanceId":null,"name":"","description":"","expertCode":"RESULT_VAR = VAR_0;","expertVar":"//var RESULT_VAR = #E6E6EA.(request).params.objID;\n//var VAR_0 = #BFC798.(response).success.result.id;","simpleCode":null,"language":"js","links":[]},"to":[{"color":"#E6E6EA","type":"request","field":"params.objID","links":[]}],"links":[]},{"from":[{"color":"#6477AB","type":"response","field":"success.result[]","links":[]}],"enhancement":{"enhanceId":null,"name":"","description":"","expertCode":"RESULT_VAR = VAR_0[0].id","expertVar":"//var RESULT_VAR = #9EC798.(request).params.objID;\n//var VAR_0 = #6477AB.(response).success.result[];","simpleCode":null,"language":"js","links":[]},"to":[{"color":"#9EC798","type":"request","field":"params.objID","links":[]}],"links":[]},{"from":[{"color":"#C77E7E","type":"response","field":"success.ConfigItem[].InciState","links":[]}],"enhancement":{"enhanceId":null,"name":"","description":"","expertCode":"if( VAR_0 == \"Operational\"){\n  RESULT_VAR = \"6\";\n}else{\n  RESULT_VAR = \"10\";\n}","expertVar":"//var RESULT_VAR = #9EC798.(request).params.data.cmdb_status;\n//var VAR_0 = #C77E7E.(response).success.ConfigItem[].InciState;","simpleCode":null,"language":"js","links":[]},"to":[{"color":"#9EC798","type":"request","field":"params.data.cmdb_status","links":[]}],"links":[]},{"from":[{"color":"#6477AB","type":"response","field":"success.result[]","links":[]}],"enhancement":{"enhanceId":null,"name":"","description":"","expertCode":"RESULT_VAR = VAR_0[0].id","expertVar":"//var RESULT_VAR = #98BEC7.(request).params.objID;\n//var VAR_0 = #6477AB.(response).success.result[];","simpleCode":null,"language":"js","links":[]},"to":[{"color":"#98BEC7","type":"request","field":"params.objID","links":[]}],"links":[]},{"from":[{"color":"#C77E7E","type":"response","field":"success.ConfigItem[].CIXMLData.Vendor","links":[]}],"enhancement":{"enhanceId":null,"name":"","description":"","expertCode":"RESULT_VAR = VAR_0;","expertVar":"//var RESULT_VAR = #98BEC7.(request).params.data.manufacturer;\n//var VAR_0 = #C77E7E.(response).success.ConfigItem[].CIXMLData.Vendor;","simpleCode":null,"language":"js","links":[]},"to":[{"color":"#98BEC7","type":"request","field":"params.data.manufacturer","links":[]}],"links":[]}],"links":[]}};
let items = [...CONNECTION_TEMPLATE.connection.toConnector.methods, ...CONNECTION_TEMPLATE.connection.toConnector.operators];
items = sortByIndex(items);
let xIterator = 0;
let ALL_ARROWS = [];
function getPrevIndex(index){
    if(index === '0'){
        return '';
    }
    let splitIndex = index.split('_');
    if(splitIndex[splitIndex.length - 1] === '0'){
        splitIndex.pop();
        return splitIndex.join('_');
    } else{
        splitIndex[splitIndex.length - 1] = splitIndex[splitIndex.length - 1] - 1;
        return splitIndex.join('_');
    }
}
for(let i = 0; i < items.length; i++){
    let currentSplitIndex = items[i].index.split('_');
    if(currentSplitIndex[currentSplitIndex.length - 1] !== '0'){
        xIterator += 200;
    }
    items[i].x = xIterator;
    items[i].y = 150 * (currentSplitIndex.length - 1)
    if(items[i].type){
        items[i].x += 35;
        items[i].y += 10;
    }
    items[i].id = items[i].index;
    if(items[i].index !== '0') {
        ALL_ARROWS.push({from: getPrevIndex(items[i].index), to: items[i].index});
    }
}
export const ALL_ITEMS  = items;


export const ITEMS = [
    {
        id: 1, x: 0, y: 0, name: 'Get Clients', invoker: 'i-doit',
        items: ALL_ITEMS,
        arrows: ALL_ARROWS
    },
    {
        id: 2, x: 250, y: 40, name: 'Find Tickets', invoker: 'otrs',
        items: [{id: 11, x: 0, y: 0, name: 'ConfigItemSearch', label: 'Search Items', invoker: 'otrs'},
            {id: 22, x: 240, y: 0, name: 'ConfigItemCreate', label: 'Create Items', invoker: 'otrs'},],
        arrows: [{from: 11, to: 22}]

    },
    {
        id: 3, x: 450, y: 50, type: 'if', label: 'IF'
    },
];

export const ARROWS = [
    {from: 1, to: 2},
    {from: 2, to: 3},
];
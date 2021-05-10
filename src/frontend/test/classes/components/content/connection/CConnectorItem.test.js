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

import React from 'react';
import CConnectorItem, {INSIDE_ITEM} from "../../../../../app/classes/components/content/connection/CConnectorItem";
import {ALL_COLORS} from "@classes/components/content/connection/CConnection";
import COperatorItem from "@classes/components/content/connection/operator/COperatorItem";
import CMethodItem from "@classes/components/content/connection/method/CMethodItem";
import {sortByIndex} from "@utils/app";

describe('Remove Method', () => {
    it('should NOT be the last method in the subtree', () => {
        const template = {"templateId":"5a8a99bf-1ba5-4fbd-9438-8a8fc633e6a7","name":"ruz template","description":"","license":null,"version":"v1.4","link":null,"connection":{"nodeId":null,"connectionId":null,"title":"4Ruz","description":"","fromConnector":{"nodeId":null,"connectorId":7,"title":null,"invoker":{"name":"CheckMK"},"methods":[{"name":"get_host_names","request":{"endpoint":"{url}?_username={_username}&_secret={_secret}&action=get_host_names","body":{"type":"object","format":"json","data":"raw","fields":{"result":"","result_code":""}},"method":"GET"},"response":{"success":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"result":[]}}},"fail":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"error":"1"}}}},"index":"0","color":"#FFCFB5"},{"name":"get_host","request":{"endpoint":"{url}?_username={_username}&_secret={_secret}&action=get_host&effective_attributes=1","body":{"type":"object","format":"json","data":"raw","fields":{"hostname":"#FFCFB5.(response).success.result[i]"}},"method":"POST"},"response":{"success":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"result":{"hostname":""}}}},"fail":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"error":"1"}}}},"index":"1_0","color":"#C77E7E"},{"name":"get_inventory","request":{"endpoint":"{url}/../host_inv_api.py?_username={_username}&_secret={_secret}&output_format=json&host={%#FFCFB5.(response).success.result[i]%}","body":{"type":"object","format":"json","data":"raw","fields":{"result":"","result_code":""}},"method":"GET"},"response":{"success":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"result":{"software":"","networking":"","hardware":{"components":{"chassis":[{"serial":"","model":""}]}}}}}},"fail":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"error":"1"}}}},"index":"1_1","color":"#F4B6C2"}],"operators":[{"index":"1","type":"loop","condition":{"leftStatement":{"color":"#FFCFB5","field":"success.result[]","type":"response","rightPropertyValue":""},"relationalOperator":"","rightStatement":null},"iterator":"i"}]},"toConnector":{"nodeId":null,"connectorId":5,"title":null,"invoker":{"name":"i-doit"},"methods":[{"name":"cmdb.objects.read","request":{"endpoint":"{url}","body":{"type":"object","format":"json","data":"raw","fields":{"method":"cmdb.objects.read","id":"1","params":{"filter":{"sys_id":"","last_name":"","ids":[],"type_title":"","title":"#C77E7E.(response).success.result.hostname","type":[],"first_name":"","email":""},"apikey":"{apikey}","limit":"","order_by":"","language":"","sort":""},"version":"2.0"}},"method":"POST"},"response":{"success":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"result":[{"cmdb_status_title":"","image":"","sysid":"","created":"","type_title":"","id":"","cmdb_status":"","type":"","title":"","updated":"","status":"","type_group_title":""}],"id":"","jsonrpc":""}}},"fail":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"error":{"code":"","data":"","message":""}}}}},"index":"0_0_0","color":"#6477AB"},{"name":"cmdb.object.create","request":{"endpoint":"{url}","body":{"type":"object","format":"json","data":"raw","fields":{"method":"cmdb.object.create","id":"1","params":{"apikey":"{apikey}","language":"","cmdb_status":"6","type":"#C77E7E.(response).success.result","title":"#C77E7E.(response).success.result.hostname"},"version":"2.0"}},"method":"POST"},"response":{"success":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"result":{"id":"","message":"","status":""},"id":"","jsonrpc":""}}},"fail":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"error":{"code":"","data":"","message":""}}}}},"index":"0_0_1_0","color":"#98BEC7"},{"name":"cmdb.category.read","request":{"endpoint":"{url}","body":{"type":"object","format":"json","data":"raw","fields":{"method":"cmdb.category.read","id":"1","params":{"apikey":"{apikey}","objID":"#6477AB.(response).success.result[0].id","language":"","category":"C__CATG__IP"},"version":"2.0"}},"method":"POST"},"response":{"success":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"result":[{"parent":{"location_path":""},"hostname":"","role":{"id":"","title":""},"contact":{"mail":"","last_name":"","login":"","first_name":""},"objID":"","id":""}]}}},"fail":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"error":{"code":"","data":"","message":""}}}}},"index":"0_0_2_0","color":"#BFC798"},{"name":"cmdb.category.update","request":{"endpoint":"{url}","body":{"type":"object","format":"json","data":"raw","fields":{"method":"cmdb.category.update","id":"1","params":{"data":{"hostname":"#C77E7E.(response).success.result.hostname","category_id":"#BFC798.(response).success.result[0].id","ipv4_address":"#C77E7E.(response).success.result","primary":"1"},"apikey":"{apikey}","objID":"#6477AB.(response).success.result[0].id","language":"","category":"C__CATG__IP"},"version":"2.0"}},"method":"POST"},"response":{"success":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"result":[{"parent":{"location_path":""},"hostname":"","role":{"id":"","title":""},"contact":{"mail":"","last_name":"","login":"","first_name":""},"objID":"","id":""}]}}},"fail":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"error":{"code":"","data":"","message":""}}}}},"index":"0_0_2_2","color":"#E6E6EA"},{"name":"cmdb.category.create","request":{"endpoint":"{url}","body":{"type":"object","format":"json","data":"raw","fields":{"method":"cmdb.category.create","id":"1","params":{"data":{"title":"","manufacturer":""},"apikey":"{apikey}","objID":"","language":"","category":""},"version":"2.0"}},"method":"POST"},"response":{"success":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"result":[{"id":"","message":""}]}}},"fail":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"error":{"code":"","data":"","message":""}}}}},"index":"0_0_2_3_0","color":"#F0E4E4"},{"name":"cmdb.objects.read","request":{"endpoint":"{url}","body":{"type":"object","format":"json","data":"raw","fields":{"method":"cmdb.objects.read","id":"1","params":{"filter":{"sys_id":"","ids":[],"last_name":"","type_title":"","title":"#F4B6C2.(response).success.result.software","type":[],"first_name":"","email":""},"apikey":"{apikey}","limit":"","order_by":"","language":"","sort":""},"version":"2.0"}},"method":"POST"},"response":{"success":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"result":[{"image":"","cmdb_status_title":"","sysid":"","created":"","type_title":"","id":"","cmdb_status":"","title":"","type":"","updated":"","type_group_title":"","status":""}],"id":"","jsonrpc":""}}},"fail":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"error":{"code":"","data":"","message":""}}}}},"index":"0_0_2_4_0","color":"#FE8A71"},{"name":"cmdb.object.create","request":{"endpoint":"{url}","body":{"type":"object","format":"json","data":"raw","fields":{"method":"cmdb.object.create","id":"1","params":{"apikey":"{apikey}","language":"","cmdb_status":"6","type":"#F4B6C2.(response).success.result.software","title":"#F4B6C2.(response).success.result.software"},"version":"2.0"}},"method":"POST"},"response":{"success":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"result":{"id":"","message":"","status":""},"id":"","jsonrpc":""}}},"fail":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"error":{"code":"","data":"","message":""}}}}},"index":"0_0_2_4_1_0","color":"#E7EFF6"},{"name":"cmdb.category.create","request":{"endpoint":"{url}","body":{"type":"object","format":"json","data":"raw","fields":{"method":"cmdb.category.create","id":"1","params":{"data":{"application":"#E7EFF6.(response).success.result.id"},"apikey":"{apikey}","objID":"#6477AB.(response).success.result[0].id","language":"","category":"C__CATG__OPERATING_SYSTEM"},"version":"2.0"}},"method":"POST"},"response":{"success":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"result":[{"id":"","message":""}]}}},"fail":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"error":{"code":"","data":"","message":""}}}}},"index":"0_0_2_4_1_1","color":"#AF28E4"},{"name":"cmdb.category.update","request":{"endpoint":"{url}","body":{"type":"object","format":"json","data":"raw","fields":{"method":"cmdb.category.update","id":"1","params":{"data":{"application":"#FE8A71.(response).success.result[0].id"},"apikey":"{apikey}","objID":"#6477AB.(response).success.result[0].id","language":"","category":"C__CATG__OPERATING_SYSTEM"},"version":"2.0"}},"method":"POST"},"response":{"success":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"result":[{"parent":{"location_path":""},"hostname":"","role":{"id":"","title":""},"contact":{"mail":"","last_name":"","login":"","first_name":""},"objID":"","id":""}]}}},"fail":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"error":{"code":"","data":"","message":""}}}}},"index":"0_0_2_4_2_0","color":"#5FC798"},{"name":"cmdb.category.create","request":{"endpoint":"{url}","body":{"type":"object","format":"json","data":"raw","fields":{"method":"cmdb.category.create","id":"1","params":{"data":{"serial":"#F4B6C2.(response).success.result.hardware","title":"#F4B6C2.(response).success.result.hardware"},"apikey":"{apikey}","objID":"#6477AB.(response).success.result[0].id","language":"","category":"C__CATG__MODEL"},"version":"2.0"}},"method":"POST"},"response":{"success":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"result":[{"id":"","message":""}]}}},"fail":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"error":{"code":"","data":"","message":""}}}}},"index":"0_0_2_5_0","color":"#E1C798"},{"name":"cmdb.category.read","request":{"endpoint":"{url}","body":{"type":"object","format":"json","data":"raw","fields":{"method":"cmdb.category.read","id":"1","params":{"apikey":"{apikey}","objID":"#6477AB.(response).success.result[0].id","language":"","category":"C__CATG__CUSTOM_FIELDS_CHASSIS"},"version":"2.0"}},"method":"POST"},"response":{"success":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"result":[{"parent":{"location_path":""},"hostname":"","role":{"id":"","title":""},"contact":{"mail":"","last_name":"","login":"","first_name":""},"objID":"","id":""}]}}},"fail":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"error":{"code":"","data":"","message":""}}}}},"index":"0_0_2_5_1_0_0_0","color":"#9EC798"},{"name":"cmdb.category.create","request":{"endpoint":"{url}","body":{"type":"object","format":"json","data":"raw","fields":{"method":"cmdb.category.create","id":"1","params":{"data":{"f_text_c_1620137109493":"#F4B6C2.(response).success.result.hardware.components.chassis[j].model","f_text_c_1620137000258":"#F4B6C2.(response).success.result.hardware.components.chassis[j].serial","title":"","manufacturer":""},"apikey":"{apikey}","objID":"#6477AB.(response).success.result[0].id","language":"","category":"C__CATG__CUSTOM_FIELDS_CHASSIS"},"version":"2.0"}},"method":"POST"},"response":{"success":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"result":[{"id":"","message":""}]}}},"fail":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"error":{"code":"","data":"","message":""}}}}},"index":"0_0_2_5_1_0_0_1_0_0","color":"#E41298"}],"operators":[{"index":"0","type":"loop","condition":{"leftStatement":{"color":"#FFCFB5","field":"success.result[]","type":"response","rightPropertyValue":""},"relationalOperator":"","rightStatement":null},"iterator":"i"},{"index":"0_0","type":"if","condition":{"leftStatement":{"color":"#C77E7E","field":"success.result.attributes.tag_opencelium_sync","type":"response","rightPropertyValue":""},"relationalOperator":"=","rightStatement":{"color":"","field":"yes","rightPropertyValue":"","type":""}},"iterator":null},{"index":"0_0_1","type":"if","condition":{"leftStatement":{"color":"#6477AB","field":"success.result[]","type":"response","rightPropertyValue":""},"relationalOperator":"IsEmpty","rightStatement":null},"iterator":null},{"index":"0_0_2","type":"if","condition":{"leftStatement":{"color":"#6477AB","field":"success.result[]","type":"response","rightPropertyValue":""},"relationalOperator":"NotEmpty","rightStatement":null},"iterator":null},{"index":"0_0_2_1","type":"if","condition":{"leftStatement":{"color":"#BFC798","field":"success.result[]","type":"response","rightPropertyValue":""},"relationalOperator":"NotEmpty","rightStatement":null},"iterator":null},{"index":"0_0_2_3","type":"if","condition":{"leftStatement":{"color":"#BFC798","field":"success.result[]","type":"response","rightPropertyValue":""},"relationalOperator":"IsEmpty","rightStatement":null},"iterator":null},{"index":"0_0_2_4","type":"if","condition":{"leftStatement":{"color":"#F4B6C2","field":"success.result","type":"response","rightPropertyValue":""},"relationalOperator":"PropertyExists","rightStatement":{"color":"","field":"software","rightPropertyValue":"","type":""}},"iterator":null},{"index":"0_0_2_4_1","type":"if","condition":{"leftStatement":{"color":"#FE8A71","field":"success.result[]","type":"response","rightPropertyValue":""},"relationalOperator":"IsEmpty","rightStatement":null},"iterator":null},{"index":"0_0_2_4_2","type":"if","condition":{"leftStatement":{"color":"#FE8A71","field":"success.result[]","type":"response","rightPropertyValue":""},"relationalOperator":"NotEmpty","rightStatement":null},"iterator":null},{"index":"0_0_2_5","type":"if","condition":{"leftStatement":{"color":"#F4B6C2","field":"success.result","type":"response","rightPropertyValue":""},"relationalOperator":"PropertyExists","rightStatement":{"color":"","field":"hardware","rightPropertyValue":"","type":""}},"iterator":null},{"index":"0_0_2_5_1","type":"if","condition":{"leftStatement":{"color":"#F4B6C2","field":"success.result.hardware","type":"response","rightPropertyValue":""},"relationalOperator":"PropertyExists","rightStatement":{"color":"","field":"components","rightPropertyValue":"","type":""}},"iterator":null},{"index":"0_0_2_5_1_0","type":"if","condition":{"leftStatement":{"color":"#F4B6C2","field":"success.result.hardware.components","type":"response","rightPropertyValue":""},"relationalOperator":"PropertyExists","rightStatement":{"color":"","field":"chassis","rightPropertyValue":"","type":""}},"iterator":null},{"index":"0_0_2_5_1_0_0","type":"if","condition":{"leftStatement":{"color":"#F4B6C2","field":"success.result.hardware.components.chassis","type":"response","rightPropertyValue":""},"relationalOperator":"IsTypeOf","rightStatement":{"color":"","field":"ARR","rightPropertyValue":"","type":""}},"iterator":null},{"index":"0_0_2_5_1_0_0_1","type":"loop","condition":{"leftStatement":{"color":"#F4B6C2","field":"success.result.hardware.components.chassis[]","type":"response","rightPropertyValue":""},"relationalOperator":"","rightStatement":null},"iterator":"j"},{"index":"0_0_2_5_1_0_0_1_0","type":"if","condition":{"leftStatement":{"color":"#9EC798","field":"success.result[]","type":"response","rightPropertyValue":""},"relationalOperator":"IsEmpty","rightStatement":null},"iterator":null}]},"fieldBinding":[{"from":[{"color":"#C77E7E","field":"success.result.hostname","type":"response"}],"to":[{"color":"#6477AB","field":"params.filter.title","type":"request"}],"enhancement":{"name":"","description":"","language":"js","simpleCode":null,"expertVar":"//var RESULT_VAR = #6477AB.(request).params.filter.title;\n//var VAR_0 = #C77E7E.(response).success.result.hostname;","expertCode":"RESULT_VAR = VAR_0;"}},{"from":[{"color":"#C77E7E","field":"success.result.hostname","type":"response"}],"to":[{"color":"#98BEC7","field":"params.title","type":"request"}],"enhancement":{"name":"","description":"","language":"js","simpleCode":null,"expertVar":"//var RESULT_VAR = #98BEC7.(request).params.title;\n//var VAR_0 = #C77E7E.(response).success.result.hostname;","expertCode":"RESULT_VAR = VAR_0;"}},{"from":[{"color":"#C77E7E","field":"success.result","type":"response"}],"to":[{"color":"#98BEC7","field":"params.type","type":"request"}],"enhancement":{"name":"","description":"","language":"js","simpleCode":null,"expertVar":"//var RESULT_VAR = #98BEC7.(request).params.type;\n//var VAR_0 = #C77E7E.(response).success.result;","expertCode":"var type = \"\";\n\nif(VAR_0.hasOwnProperty('attributes') && VAR_0.attributes \n&& VAR_0.attributes.hasOwnProperty('tag_device_type') \n&& VAR_0.attributes.tag_device_type){\n  \n  if(VAR_0.attributes.tag_device_type == \"switch\"){\n    type = \"6\";\n  }else if(VAR_0.attributes.tag_device_type == \"server\"){\n    type = \"5\";\n  }else if(VAR_0.attributes.tag_device_type == \"wap\"){\n    type = \"27\";\n  }else if(VAR_0.attributes.tag_device_type == \"firewall\"){\n    type = \"123\";\n  }else if(VAR_0.attributes.tag_device_type == \"router\"){\n    type = \"7\";\n  }else if(VAR_0.attributes.tag_device_type == \"vgw_sip\"){\n    type = \"7\";\n  }else if(VAR_0.attributes.tag_device_type == \"vgw_mgcp\"){\n    type = \"7\";\n  }else if(VAR_0.attributes.tag_device_type == \"dect_base\"){\n    type = \"124\";\n  }else if(VAR_0.attributes.tag_device_type == \"ups\"){\n    type = \"50\";\n  }else if(VAR_0.attributes.tag_device_type == \"nas\"){\n    type = \"9\";\n  }else if(VAR_0.attributes.tag_device_type == \"workstation\"){\n    type = \"10\";\n  }\n  \n}\n\nRESULT_VAR = type;"}},{"from":[{"color":"#6477AB","field":"success.result[].id","type":"response"}],"to":[{"color":"#BFC798","field":"params.objID","type":"request"}],"enhancement":{"name":"","description":"","language":"js","simpleCode":null,"expertVar":"//var RESULT_VAR = #BFC798.(request).params.objID;\n//var VAR_0 = #6477AB.(response).success.result[0].id;","expertCode":"RESULT_VAR = VAR_0;"}},{"from":[{"color":"#6477AB","field":"success.result[].id","type":"response"}],"to":[{"color":"#E6E6EA","field":"params.objID","type":"request"}],"enhancement":{"name":"","description":"","language":"js","simpleCode":null,"expertVar":"//var RESULT_VAR = #E6E6EA.(request).params.objID;\n//var VAR_0 = #6477AB.(response).success.result[0].id;","expertCode":"RESULT_VAR = VAR_0;"}},{"from":[{"color":"#C77E7E","field":"success.result","type":"response"}],"to":[{"color":"#E6E6EA","field":"params.data.ipv4_address","type":"request"}],"enhancement":{"name":"","description":"","language":"js","simpleCode":null,"expertVar":"//var RESULT_VAR = #E6E6EA.(request).params.data.ipv4_address;\n//var VAR_0 = #C77E7E.(response).success.result;","expertCode":"var ip = \"\";\n\nif(VAR_0.hasOwnProperty('attributes') && VAR_0.attributes \n&& VAR_0.attributes.hasOwnProperty('ipaddress') \n&& VAR_0.attributes.ipaddress){\n  ip = VAR_0.attributes.ipaddress;\n}\n\nRESULT_VAR = ip;"}},{"from":[{"color":"#BFC798","field":"success.result[].id","type":"response"}],"to":[{"color":"#E6E6EA","field":"params.data.category_id","type":"request"}],"enhancement":{"name":"","description":"","language":"js","simpleCode":null,"expertVar":"//var RESULT_VAR = #E6E6EA.(request).params.data.category_id;\n//var VAR_0 = #BFC798.(response).success.result[0].id;","expertCode":"RESULT_VAR = parseInt(VAR_0);"}},{"from":[{"color":"#C77E7E","field":"success.result.hostname","type":"response"}],"to":[{"color":"#E6E6EA","field":"params.data.hostname","type":"request"}],"enhancement":{"name":"","description":"","language":"js","simpleCode":null,"expertVar":"//var RESULT_VAR = #E6E6EA.(request).params.data.hostname;\n//var VAR_0 = #C77E7E.(response).success.result.hostname;","expertCode":"RESULT_VAR = VAR_0;"}},{"from":[{"color":"#F4B6C2","field":"success.result.software","type":"response"}],"to":[{"color":"#FE8A71","field":"params.filter.title","type":"request"}],"enhancement":{"name":"","description":"","language":"js","simpleCode":null,"expertVar":"//var RESULT_VAR = #FE8A71.(request).params.filter.title;\n//var VAR_0 = #F4B6C2.(response).success.result.software;","expertCode":"var osname = \"\";\n\nif(VAR_0.hasOwnProperty('os') && VAR_0.os \n&& VAR_0.os.hasOwnProperty('name') \n&& VAR_0.os.name){\n  osname = VAR_0.os.name;\n}else if(VAR_0.hasOwnProperty('os') && \nVAR_0.os && VAR_0.os.hasOwnProperty('type') && VAR_0.os.type &&\nVAR_0.os && VAR_0.os.hasOwnProperty('version') && VAR_0.os.version\n){\n  osname = VAR_0.os.type + \" \" + VAR_0.os.version;\n}\n\nRESULT_VAR = osname;"}},{"from":[{"color":"#F4B6C2","field":"success.result.software","type":"response"}],"to":[{"color":"#E7EFF6","field":"params.title","type":"request"}],"enhancement":{"name":"","description":"","language":"js","simpleCode":null,"expertVar":"//var RESULT_VAR = #E7EFF6.(request).params.title;\n//var VAR_0 = #F4B6C2.(response).success.result.software;","expertCode":"var osname = \"\";\n\nif(VAR_0.hasOwnProperty('os') && VAR_0.os \n&& VAR_0.os.hasOwnProperty('name') \n&& VAR_0.os.name){\n  osname = VAR_0.os.name;\n}else if(VAR_0.hasOwnProperty('os') && \nVAR_0.os && VAR_0.os.hasOwnProperty('type') && VAR_0.os.type &&\nVAR_0.os && VAR_0.os.hasOwnProperty('version') && VAR_0.os.version\n){\n  osname = VAR_0.os.type + \" \" + VAR_0.os.version;\n}\n\nRESULT_VAR = osname;"}},{"from":[{"color":"#F4B6C2","field":"success.result.software","type":"response"}],"to":[{"color":"#E7EFF6","field":"params.type","type":"request"}],"enhancement":{"name":"","description":"","language":"js","simpleCode":null,"expertVar":"//var RESULT_VAR = #E7EFF6.(request).params.type;\n//var VAR_0 = #F4B6C2.(response).success.result.software;","expertCode":"var osname = \"\";\n\nif(VAR_0.hasOwnProperty('os') && VAR_0.os \n&& VAR_0.os.hasOwnProperty('name') \n&& VAR_0.os.name){\n  osname = VAR_0.os.name;\n}else if(VAR_0.hasOwnProperty('os') && \nVAR_0.os && VAR_0.os.hasOwnProperty('type') && VAR_0.os.type &&\nVAR_0.os && VAR_0.os.hasOwnProperty('version') && VAR_0.os.version\n){\n  osname = VAR_0.os.type + \" \" + VAR_0.os.version;\n}\n\nvar type = \"\";\nif(osname){\n  type = \"35\";\n}\n\nRESULT_VAR = type;"}},{"from":[{"color":"#6477AB","field":"success.result[].id","type":"response"}],"to":[{"color":"#AF28E4","field":"params.objID","type":"request"}],"enhancement":{"name":"","description":"","language":"js","simpleCode":null,"expertVar":"//var RESULT_VAR = #AF28E4.(request).params.objID;\n//var VAR_0 = #6477AB.(response).success.result[0].id;","expertCode":"RESULT_VAR = VAR_0;"}},{"from":[{"color":"#E7EFF6","field":"success.result.id","type":"response"}],"to":[{"color":"#AF28E4","field":"params.data.application","type":"request"}],"enhancement":{"name":"","description":"","language":"js","simpleCode":null,"expertVar":"//var RESULT_VAR = #AF28E4.(request).params.data.application;\n//var VAR_0 = #E7EFF6.(response).success.result.id;","expertCode":"RESULT_VAR = VAR_0;"}},{"from":[{"color":"#6477AB","field":"success.result[].id","type":"response"}],"to":[{"color":"#5FC798","field":"params.objID","type":"request"}],"enhancement":{"name":"","description":"","language":"js","simpleCode":null,"expertVar":"//var RESULT_VAR = #5FC798.(request).params.objID;\n//var VAR_0 = #6477AB.(response).success.result[0].id;","expertCode":"RESULT_VAR = VAR_0;"}},{"from":[{"color":"#FE8A71","field":"success.result[].id","type":"response"}],"to":[{"color":"#5FC798","field":"params.data.application","type":"request"}],"enhancement":{"name":"","description":"","language":"js","simpleCode":null,"expertVar":"//var RESULT_VAR = #5FC798.(request).params.data.application;\n//var VAR_0 = #FE8A71.(response).success.result[0].id;","expertCode":"RESULT_VAR = VAR_0;"}},{"from":[{"color":"#6477AB","field":"success.result[].id","type":"response"}],"to":[{"color":"#9EC798","field":"params.objID","type":"request"}],"enhancement":{"name":"","description":"","language":"js","simpleCode":null,"expertVar":"//var RESULT_VAR = #9EC798.(request).params.objID;\n//var VAR_0 = #6477AB.(response).success.result[0].id;","expertCode":"RESULT_VAR = VAR_0;"}},{"from":[{"color":"#6477AB","field":"success.result[].id","type":"response"}],"to":[{"color":"#E41298","field":"params.objID","type":"request"}],"enhancement":{"name":"","description":"","language":"js","simpleCode":null,"expertVar":"//var RESULT_VAR = #E41298.(request).params.objID;\n//var VAR_0 = #6477AB.(response).success.result[0].id;","expertCode":"RESULT_VAR = VAR_0;"}},{"from":[{"color":"#F4B6C2","field":"success.result.hardware.components.chassis[].serial","type":"response"}],"to":[{"color":"#E41298","field":"params.data.f_text_c_1620137000258","type":"request"}],"enhancement":{"name":"","description":"","language":"js","simpleCode":null,"expertVar":"//var RESULT_VAR = #E41298.(request).params.data.f_text_c_1620137000258;\n//var VAR_0 = #F4B6C2.(response).success.result.hardware.components.chassis[j].serial;","expertCode":"RESULT_VAR = VAR_0;"}},{"from":[{"color":"#F4B6C2","field":"success.result.hardware.components.chassis[].model","type":"response"}],"to":[{"color":"#E41298","field":"params.data.f_text_c_1620137109493","type":"request"}],"enhancement":{"name":"","description":"","language":"js","simpleCode":null,"expertVar":"//var RESULT_VAR = #E41298.(request).params.data.f_text_c_1620137109493;\n//var VAR_0 = #F4B6C2.(response).success.result.hardware.components.chassis[j].model;","expertCode":"RESULT_VAR = VAR_0;"}},{"from":[{"color":"#6477AB","field":"success.result[].id","type":"response"}],"to":[{"color":"#E1C798","field":"params.objID","type":"request"}],"enhancement":{"name":"","description":"","language":"js","simpleCode":null,"expertVar":"//var RESULT_VAR = #E1C798.(request).params.objID;\n//var VAR_0 = #6477AB.(response).success.result[0].id;","expertCode":"RESULT_VAR = VAR_0;"}},{"from":[{"color":"#F4B6C2","field":"success.result.hardware","type":"response"}],"to":[{"color":"#E1C798","field":"params.data.serial","type":"request"}],"enhancement":{"name":"","description":"","language":"js","simpleCode":null,"expertVar":"//var RESULT_VAR = #E1C798.(request).params.data.serial;\n//var VAR_0 = #F4B6C2.(response).success.result.hardware;","expertCode":"var serial = \"\";\n\nif(VAR_0 && VAR_0.hasOwnProperty(\"system\") \n&& VAR_0.system.hasOwnProperty(\"serial\") &&  VAR_0.system.serial){\n  model = VAR_0.system.serial;\n}\n\nRESULT_VAR = serial;"}},{"from":[{"color":"#F4B6C2","field":"success.result.hardware","type":"response"}],"to":[{"color":"#E1C798","field":"params.data.title","type":"request"}],"enhancement":{"name":"","description":"","language":"js","simpleCode":null,"expertVar":"//var RESULT_VAR = #E1C798.(request).params.data.title;\n//var VAR_0 = #F4B6C2.(response).success.result.hardware;","expertCode":"var model = \"\";\n\nif(VAR_0 && VAR_0.hasOwnProperty(\"system\") \n&& VAR_0.system.hasOwnProperty(\"model\") &&  VAR_0.system.model){\n  model = VAR_0.system.model;\n}\n\nRESULT_VAR = model;"}}]}};
        const methodForRemoving = {"name":"cmdb.category.update","request":{"endpoint":"{url}","body":{"type":"object","format":"json","data":"raw","fields":{"method":"cmdb.category.update","id":"1","params":{"data":{"hostname":"#C77E7E.(response).success.result.hostname","category_id":"#BFC798.(response).success.result[0].id","ipv4_address":"#C77E7E.(response).success.result","primary":"1"},"apikey":"{apikey}","objID":"#6477AB.(response).success.result[0].id","language":"","category":"C__CATG__IP"},"version":"2.0"}},"method":"POST"},"response":{"success":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"result":[{"parent":{"location_path":""},"hostname":"","role":{"id":"","title":""},"contact":{"mail":"","last_name":"","login":"","first_name":""},"objID":"","id":""}]}}},"fail":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"error":{"code":"","data":"","message":""}}}}},"index":"0_0_2_2","color":"#E6E6EA"};

        let connectorItem = CConnectorItem.createConnectorItem(template.connection.toConnector);
        let expected = [ '0',
            '0_0',
            '0_0_0',
            '0_0_1',
            '0_0_1_0',
            '0_0_2',
            '0_0_2_0',
            '0_0_2_1',
            '0_0_2_2',
            '0_0_2_2_0',
            '0_0_2_3',
            '0_0_2_3_0',
            '0_0_2_3_1',
            '0_0_2_3_1_0',
            '0_0_2_3_1_1',
            '0_0_2_3_2',
            '0_0_2_3_2_0',
            '0_0_2_4',
            '0_0_2_4_0',
            '0_0_2_4_1',
            '0_0_2_4_1_0',
            '0_0_2_4_1_0_0',
            '0_0_2_4_1_0_0_0',
            '0_0_2_4_1_0_0_1',
            '0_0_2_4_1_0_0_1_0',
            '0_0_2_4_1_0_0_1_0_0' ]
        connectorItem.removeMethod(methodForRemoving);
        let methods = connectorItem.methods.map(m => {return {index: m.index, name: m.name}});
        let operators = connectorItem.operators.map(o => {return {index: o.index, name: o.type}});
        let received = [...methods, ...operators];
        received = sortByIndex(received);
        console.log(expected);
        console.log(received);
        expect(received.map(item => item.index)).toEqual(expected);
    });
});

describe.skip('Add Method', () => {
    let connectorItem = CConnectorItem.createConnectorItem();
    beforeEach(() => {
        connectorItem.title = 'i-doit';
        connectorItem.setConnectorType('fromConnector');
        connectorItem.methods = [
            {index: '0'},
            {index: '1'},
            {index: '2_0'},
            {index: '2_1'},
            {index: '2_2'},
            {index: '3'},
            {index: '4'},
            {index: '5'},
        ];
        connectorItem.operators = [
            {index: '2'},
        ];
    });

    it('should NOT be the last method in the subtree', () => {
        expect(connectorItem.isLastItemInTheTree('1')).toBeFalsy();
    });

    it('should NOT be the last method in the subtree', () => {
        expect(connectorItem.isLastItemInTheTree('2_0')).toBeFalsy();
    });

    it('should NOT be the last method in the subtree', () => {
        expect(connectorItem.isLastItemInTheTree('2_1')).toBeFalsy();
    });

    it('should be the last method in the subtree', () => {
        expect(connectorItem.isLastItemInTheTree('2_2')).toBeTruthy();
    });

    it('should NOT be the last method in the subtree', () => {
        expect(connectorItem.isLastItemInTheTree('4')).toBeFalsy();
    });

    it('should be the last method in the subtree', () => {
        expect(connectorItem.isLastItemInTheTree('5')).toBeTruthy();
    });
});


describe.skip('Check OperatorsHistory', () => {
    let connectorItem = CConnectorItem.createConnectorItem();
    beforeEach(() => {
        connectorItem.methods = [];
        connectorItem.operators = [];
    });

    it('should NOT have any element', () => {
        connectorItem.addMethod({name: 'method', color: ALL_COLORS[0]});
        expect(connectorItem.operatorsHistory.length).toBe(0);
    });

    it('should NOT have any element', () => {
        connectorItem.addMethod({name: 'method', color: ALL_COLORS[0]});
        connectorItem.addOperator({type: 'if'});
        expect(connectorItem.operatorsHistory.length).toBe(0);
    });

    it('should have one element with index "1"', () => {
        connectorItem.addMethod({name: 'method', color: ALL_COLORS[0]});
        connectorItem.addOperator({type: 'if'});
        connectorItem.addMethod({name: 'method 2', color: ALL_COLORS[1]}, INSIDE_ITEM);
        expect(connectorItem.operatorsHistory.length).toBe(1);
        expect(connectorItem.operatorsHistory[0].index).toBe('1');
    });

    it('should have two elements with index "1" and "1_1"', () => {
        connectorItem.addMethod({name: 'method', color: ALL_COLORS[0]});
        connectorItem.addOperator({type: 'if'});
        connectorItem.addMethod({name: 'method 2', color: ALL_COLORS[1]}, INSIDE_ITEM);
        connectorItem.addOperator({type: 'if'});
        connectorItem.addMethod({name: 'method 2', color: ALL_COLORS[2]}, INSIDE_ITEM);
        expect(connectorItem.operatorsHistory.length).toBe(2);
        expect(connectorItem.operatorsHistory[0].index).toBe('1');
        expect(connectorItem.operatorsHistory[1].index).toBe('1_1');
    });
});

describe.skip('Check Iterators', () => {
    let connectorItem = CConnectorItem.createConnectorItem();
    beforeEach(() => {
        connectorItem.methods = [];
        connectorItem.operators = [];
    });

    it('first operator should be \'i\'', () => {
        connectorItem.addOperator({type: 'loop'});
        expect(connectorItem.operators[0].iterator).toBe('i');
    });

    it('second operator should be \'i\'', () => {
        connectorItem.addOperator({type: 'loop'});
        connectorItem.addOperator({type: 'loop'});
        expect(connectorItem.operators[1].iterator).toBe('i');
    });

    it('second operator should be \'j\'', () => {
        connectorItem.addOperator({type: 'loop'});
        connectorItem.addOperator({type: 'loop'}, INSIDE_ITEM);
        expect(connectorItem.operators[1].iterator).toBe('j');
    });

    it('third operator should be \'k\'', () => {
        connectorItem.addOperator({type: 'loop'});
        connectorItem.addOperator({type: 'loop'}, INSIDE_ITEM);
        connectorItem.addOperator({type: 'loop'}, INSIDE_ITEM);
        console.log(connectorItem.operators[2].iterator);
        expect(connectorItem.operators[2].iterator).toBe('k');
    });
});

describe.skip('Check Get All Previous Methods for defined item (Operator component. Select Box)', () => {
    let connectorItem = CConnectorItem.createConnectorItem();
    const item = COperatorItem.createOperatorItem({index: '2_0_0_0_1', type: 'if'})
    beforeEach(() => {
        connectorItem.methods = [
            {"index":"0","name":"TicketGet","color":"#C77E7E"},
            {"index":"1_0","name":"ConfigItemCreate","color":"#6477AB"},
            {"index":"1_1_0","name":"ConfigItemUpdate","color":"#98BEC7"},
            {"index":"1_1_1_0","name":"ConfigItemSearch","color":"#9EC798"},
            {"index":"1_1_1_1","name":"ConfigItemDelete","color":"#BFC798"},
            {"index":"1_1_2_0_0_0","name":"ConfigItemGet","color":"#E6E6EA"},
            {"index":"2_0_0_0_0","name":"ConfigItemGet","color":"#F4B6C2"}
        ];
        connectorItem.operators = [{"index":"1","type":"if"},{"index":"1_1","type":"loop"},{"index":"1_1_1","type":"if"},{"index":"1_1_2","type":"if"},{"index":"1_1_2_0","type":"if"},{"index":"1_1_2_0_0","type":"if"},{"index":"2","type":"if"},{"index":"2_0","type":"if"},{"index":"2_0_0","type":"if"},{"index":"2_0_0_0","type":"if"},{"index":"2_0_0_0_1","type":"if"}];
    });

    it('should have two elements', () => {
        const expected = [
            {"label":"TicketGet","value":"t_0","color":"#C77E7E"},
            {"label":"ConfigItemGet","value":"t_2_0_0_0_0","color":"#F4B6C2"},
        ];
        const received = connectorItem.getAllPrevMethods(item);
        expect(received).toEqual(expected);
    });
});

describe('Get Previous Iterators By Method', () => {
    let connectorItem = CConnectorItem.createConnectorItem();
    beforeEach(() => {
        connectorItem.title = 'i-doit';
        connectorItem.setConnectorType('fromConnector');
        connectorItem.methods = [
            {index: '0'},
            {index: '1'},
            {index: '2_0_0'},
        ];
        connectorItem.operators = [
            {index: '2', type: 'loop', iterator: 'i'},
            {index: '2_0', type: 'loop', iterator: 'j'},
        ];
    });

    it('if loops depth is equal 2', () => {
        const method = CMethodItem.createMethodItem({index: '2_0_0'});
        connectorItem.setCurrentItem(method);
        const received = connectorItem.getPreviousIterators(method);
        const expected = ['i', 'j'];
        expect(received).toEqual(expected);
    });
});

describe('Get Previous Iterator', () => {
    let connectorItem = CConnectorItem.createConnectorItem();
    beforeEach(() => {
        connectorItem.title = 'i-doit';
        connectorItem.setConnectorType('fromConnector');
        connectorItem.methods = [
            {index: '0'},
            {index: '1'},
            {index: '2_0_0'},
        ];
        connectorItem.operators = [
            {index: '2', type: 'loop', iterator: 'i'},
            {index: '2_0', type: 'loop', iterator: 'j'},
        ];
    });

    it('if loops depth is equal 2', () => {
        const method = CMethodItem.createMethodItem({index: '2_0_0'});
        connectorItem.setCurrentItem(method);
        const received = connectorItem.getPreviousIterators(method);
        const expected = ['i', 'j'];
        expect(received).toEqual(expected);
    });
});

describe('Get Next Iterator', () => {

    it('two loops. variant 1', () => {
        const operators = [
            COperatorItem.createOperatorItem({index: '1', type: 'if', iterator: null}),
            COperatorItem.createOperatorItem({index: '1_1', type: 'loop', iterator: 'i'}),
            COperatorItem.createOperatorItem({index: '1_1_1', type: 'if', iterator: null}),
            COperatorItem.createOperatorItem({index: '1_1_3', type: 'if', iterator: null}),
        ];
        const newOperator = COperatorItem.createOperatorItem({index: '1_1_4'});
        const prevIndex = 3;
        const received = CConnectorItem.getIterator(operators, newOperator, prevIndex);
        const expected = 'j';
        expect(received).toBe(expected);
    });
    it('two loops. variant 2', () => {
        const operators = [
            COperatorItem.createOperatorItem({index: '1', type: 'if', iterator: null}),
            COperatorItem.createOperatorItem({index: '1_1', type: 'loop', iterator: 'i'}),
            COperatorItem.createOperatorItem({index: '1_1_1', type: 'if', iterator: null}),
            COperatorItem.createOperatorItem({index: '1_1_3', type: 'if', iterator: null}),
        ];
        const newOperator = COperatorItem.createOperatorItem({index: '1_1_3_0'});
        const prevIndex = 3;
        const received = CConnectorItem.getIterator(operators, newOperator, prevIndex);
        const expected = 'j';
        expect(received).toBe(expected);
    });
});
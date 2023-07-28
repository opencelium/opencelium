import {
    basicsContentData
} from "@change_component/form_elements/form_connection/form_svg/layouts/button_panel/help_block/content/data";

export const HelpBlockData: any = [
    {"nodeId":null,"connectionId":null,"title":"test","description":"test","fromConnector":{"nodeId":null,"connectorId":3,"title":null,"invoker":{"name":"trello"},"methods":[{"name":"GetBoards","request":{"endpoint":"{url}/1/members/{username}/boards?key={key}&token={token}","body":null,"method":"GET"},"response":{"success":{"status":"200","body":{"type":"array","format":"json","data":"raw","fields":{"name":"","id":""}}},"fail":{"status":"401","body":null}},"index":"0","label":null,"color":"#FFCFB5"}],"operators":[]},"toConnector":{"nodeId":null,"connectorId":3,"title":null,"invoker":{"name":"trello"},"methods":[],"operators":[]},"fieldBinding":[]}
];

export const HelpBlockAllData: any = {};

for(let i = 0; i < basicsContentData.length; i++){
    HelpBlockAllData[basicsContentData[i].animationName] = HelpBlockData[i];
}

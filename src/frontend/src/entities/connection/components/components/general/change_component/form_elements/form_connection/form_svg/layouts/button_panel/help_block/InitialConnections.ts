
export const configureAPIInitialConnection: any = {

    "nodeId":null,"connectionId":null,"title":"test","description":"","fromConnector":{"nodeId":null,"connectorId":1,"title":null,"invoker":{"name":"otrs"},"methods":[{"name":"TicketSearch","request":{"endpoint":"{url}/{WebService}/TicketSearch/{UserLogin}/{Password}","body":{"type":"object","format":"json","data":"raw","fields":{"States":[],"Types":[],"TypeIDs":[],"TicketNumber":[],"StateType":"","QueueIDs":[],"Title":[],"Queues":[],"StateIDs":[]}},"method":"POST"},"response":{"success":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"TicketID":[]}}},"fail":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"Error":{"ErrorCode":"","ErrorMessage":""}}}}},"dataAggregator":null,"index":"0","label":null,"color":"#FFCFB5"},{"name":"TicketGet","request":{"endpoint":"{url}/{WebService}/TicketGet/{UserLogin}/{Password}","body":{"type":"object","format":"json","data":"raw","fields":{"TicketID":""}},"method":"POST","header":{"Content-Type":"application/json"}},"response":{"success":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"Ticket":[{"Type":"","Owner":"","TicketID":"","TicketNumber":"","StateType":"","State":"","StateID":"","Title":"","QueueID":"","CustomerID":"","Queue":""}]}},"header":{"Content-Type":"application/json"}},"fail":{"status":"200","body":{"type":"object","format":"json","data":"raw","fields":{"Error":{"ErrorCode":"","ErrorMessage":""}}},"header":{"Content-Type":"application/json"}}},"dataAggregator":null,"index":"1","color":"#C77E7E"}],"operators":[]},
    "toConnector":{"nodeId":null,"connectorId":1,"title":null,"invoker":{"name":"otrs"},"methods":[],"operators":[]},"fieldBinding":[]
}

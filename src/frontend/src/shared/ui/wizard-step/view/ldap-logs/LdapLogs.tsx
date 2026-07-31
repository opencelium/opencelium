import React from "react";
import {useLdapStore} from "@entities/ldap/ldap.store.ts";

type LdapLogsProps = {
}
export const LdapLogs: React.FC<LdapLogsProps> = ({  }) => {
    const {logs} = useLdapStore.getState();
    return (
        <div>
            <p style={{marginLeft: 20}}>{"Logs:"}</p>
            {logs && logs.length > 0 ? logs.map((log, index) => {
                    return (
                        <div key={index} style={{margin: '20px 0 5px 20px'}}>
                            <div style={{fontWeight: 'bold'}}>{`${index + 1}. ${log.title}`}</div>
                            <div>{log.text}</div>
                        </div>
                    );
                }) :
                <div style={{margin: '20px 0 5px 20px'}}>
                    <div>No logs</div>
                </div>}
        </div>
    )
}

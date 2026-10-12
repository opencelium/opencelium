import React from "react";
import {useLdapStore} from "@entities/ldap/ldap.store.ts";
import { useI18n } from "@shared/i18n/hooks/useI18n";

type LdapLogsProps = {
}
export const LdapLogs: React.FC<LdapLogsProps> = ({  }) => {
    const { t } = useI18n('entities');
    const {logs} = useLdapStore.getState();
    return (
        <div>
            <p style={{marginLeft: 20}}>{`${t('ldap.fields.logs.label')}:`}</p>
            {logs && logs.length > 0 ? logs.map((log, index) => {
                    return (
                        <div key={index} style={{margin: '20px 0 5px 20px'}}>
                            <div style={{fontWeight: 'bold'}}>{`${index + 1}. ${log.title}`}</div>
                            <div>{log.text}</div>
                        </div>
                    );
                }) :
                <div style={{margin: '20px 0 5px 20px'}}>
                    <div>{t('ldap.fields.logs.empty')}</div>
                </div>}
        </div>
    )
}

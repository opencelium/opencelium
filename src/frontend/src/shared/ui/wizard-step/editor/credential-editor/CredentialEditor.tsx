import React, {useCallback, useEffect, useState} from "react";
import {useFormContext} from "react-hook-form";
import {FormInput} from "@shared/ui/form/FormInput";
import type {Invoker} from "@entities/invoker/model/types.ts";
import {useGetInvokersQuery} from "@entities/invoker/api/invokerApi.ts";
import {Loading} from "@shared/ui/primitives/Loading/Loading.tsx";
import {capitalizeWords} from "@shared/utils/stringUtils.ts";
import {useI18n} from "@shared/i18n/hooks/useI18n.ts";
import MasterPasswordDialog from "@widgets/MasterPasswordDialog/MasterPasswordDialog.tsx";
import type {Mode} from "@/engine/entity/EntityDefinition.ts";
import {useAppStore} from "@app/store/app.store.ts";
import {useGetConnectorMutation} from "@entities/connector/api/connectorApi.ts";
import {useParams} from "react-router-dom";
interface CredentialEditorProps {
    name: string;
    mode: Mode;
    label?: string;
}
const SENSITIVE_KEYS = ['token', 'password', 'key', 'secret'];
export function formatLabel(value: string): string {
    if (!value) return '';

    const lower = value.toLowerCase();

    // kebab-case (including uppercase letters)
    const isKebabCase = /^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)+$/.test(value);

    if (isKebabCase) {
        // only the first letter capitalized, rest as-is
        return value;
    }

    let result = value
        // camelCase → camel Case
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')

        // strip everything except letters and digits
        .replace(/[^a-zA-Z0-9 ]/g, '')

        // remove extra spaces
        .trim()
        .replace(/\s+/g, ' ')

        // lowercase the whole thing (so we can capitalize cleanly)
        .toLowerCase();

    // ✅ special-case dictionary
    const SPECIAL_MAP: Record<string, string> = {
        clientid: 'Client ID',
        clientsecret: 'Client Secret',
        xapikey: 'X-API-Key',
        usertype: 'User Type',
        apikey: 'API-Key',
        passhash: 'Pass Hash',
        jsession: 'J-Session',
        appid: 'App ID',
        apitoken: 'API-Token',
        dbdatabasetype: 'DB Type',
    };

    if (SPECIAL_MAP[result]) {
        return SPECIAL_MAP[result];
    }
    // rule for db[token]
    const dbMatch = result.match(/^db(.+)$/i);
    if (dbMatch) {
        return `DB ${capitalizeWords(dbMatch[1])}`;
    }
    return capitalizeWords(result);
}
export const CredentialEditor: React.FC<CredentialEditorProps> = ({ name, label, mode }) => {
    const { t: commonT } = useI18n('common');
    const { watch, setValue } = useFormContext();
    const {masterPassword} = useAppStore();
    const { id: routeId } = useParams();
    const {
        formState,
        getFieldState,
    } = useFormContext();
    const [getConnector, {isLoading: gettingConnector}] = useGetConnectorMutation()
    const [hasAccess, toggleHasAccess] = useState<boolean>(false);
    const { error: rhfError } = getFieldState(name, formState);
    const error = rhfError?.message;
    const invokerName: string = watch('invoker') || '';
    const connectorId = String(watch('connectorId') ?? routeId ?? '').trim();
    const [requestData, setRequestData] = useState<Record<string, string>>(null);
    const { data = [] ,  isLoading = false } = useGetInvokersQuery();
    const allInvokers: Invoker[] = data ?? [];
    const fetchRequestData = useCallback(async () => {
        if (!connectorId || !masterPassword) {
            return;
        }

        const result = await getConnector({masterPassword, id: connectorId});
        setValue('requestData', result.data.requestData, {shouldDirty: true});
    }, [connectorId, getConnector, masterPassword, setValue]);
    useEffect(() => {
        if (mode === 'create') {
            toggleHasAccess(true)
        }
    }, [mode]);
    useEffect(() => {
        if (masterPassword) {
            toggleHasAccess(true);
            void fetchRequestData()
        }
    }, [fetchRequestData, masterPassword]);
    useEffect(() => {
        const foundInvoker = allInvokers.find(i => i.name === invokerName)
        if (foundInvoker) {
            setRequestData(foundInvoker.requiredData);
        }
    }, [invokerName, data]);
    if (isLoading || gettingConnector) {
        return <div style={{
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            display: 'flex',
            marginTop: '50px'
        }}>
            <Loading/>
        </div>
    }
    if (!requestData) {
        return null;
    }
    return (
        <div style={{position: 'relative'}}>
            <div style={{
                display: 'grid',
                filter: hasAccess ? 'none' : 'blur(6px)',
            }}>
                {Object.keys(requestData).map((fieldKey, key) => {
                    const lower = fieldKey.toLowerCase();
                    const isPassword = SENSITIVE_KEYS.some(keyword => lower.includes(keyword));
                    return (
                        <FormInput
                            key={key}
                            placeholder={hasAccess ? '' : '**************'}
                            error={error && !watch(`requestData.${fieldKey}`) ? commonT('field.required') : ''}
                            autoFocus={key === 0 && hasAccess}
                            name={`requestData.${fieldKey}`}
                            label={formatLabel(fieldKey)}
                            type={isPassword ? 'password' : 'text'}
                            disabled={!hasAccess}
                        />
                    )
                })}
            </div>
            {!hasAccess && <div style={{position: 'absolute', top: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <MasterPasswordDialog/>
            </div>}
        </div>
    )
}

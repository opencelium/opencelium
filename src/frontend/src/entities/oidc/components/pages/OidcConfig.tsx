/*
 *  Copyright (C) <2023>  <becon GmbH>
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

import React, {FC, useEffect} from "react";
import {useAppDispatch, useAppSelector} from "@application/utils/store";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {getOidcConfig} from "@entity/oidc/redux_toolkit/action_creators/OidcCreators";
import Loading from "@app_component/base/loading/Loading";

const rowStyle: React.CSSProperties = {display: 'flex', padding: '6px 0', borderBottom: '1px solid #eee'};
const labelStyle: React.CSSProperties = {width: 240, fontWeight: 'bold'};
const valueStyle: React.CSSProperties = {flex: 1, wordBreak: 'break-all'};

const OidcConfig: FC = () => {
    const dispatch = useAppDispatch();
    const {config, gettingConfig} = useAppSelector(state => state.oidcReducer);

    useEffect(() => {
        dispatch(getOidcConfig());
    }, [dispatch]);

    if (gettingConfig === API_REQUEST_STATE.START || !config) {
        return <Loading top={'40vh'}/>;
    }

    const Row = ({label, value}: {label: string, value: React.ReactNode}) => (
        <div style={rowStyle}>
            <div style={labelStyle}>{label}</div>
            <div style={valueStyle}>{value === null || value === undefined || value === '' ? '—' : value}</div>
        </div>
    );

    return (
        <div style={{padding: '24px 32px', maxWidth: 900}}>
            <h2>OpenID Connect</h2>
            <p style={{color: '#666'}}>Read-only. Configure these values in <code>application.yml</code> under <code>spring.security.oidc</code>.</p>

            <h4 style={{marginTop: 24}}>General</h4>
            <Row label={'Enabled'} value={config.enabled ? 'Yes' : 'No'}/>
            <Row label={'Provider name'} value={config.providerName}/>
            <Row label={'Button text'} value={config.buttonText}/>
            <Row label={'Just-in-time provisioning'} value={config.jitProvisioning ? 'Enabled' : 'Disabled (existing users only)'}/>

            <h4 style={{marginTop: 24}}>Endpoints</h4>
            <Row label={'Issuer URI'} value={config.issuerUri}/>
            <Row label={'Authorization URI'} value={config.authorizationUri}/>
            <Row label={'Token URI'} value={config.tokenUri}/>
            <Row label={'JWK Set URI'} value={config.jwkSetUri}/>
            <Row label={'User Info URI'} value={config.userInfoUri}/>

            <h4 style={{marginTop: 24}}>Client</h4>
            <Row label={'Client ID'} value={config.clientId}/>
            <Row label={'Client secret'} value={config.clientSecret}/>
            <Row label={'Client authentication'} value={config.clientAuthenticationMethod}/>
            <Row label={'Scopes'} value={(config.scopes || []).join(', ')}/>

            <h4 style={{marginTop: 24}}>Claim mapping</h4>
            <Row label={'Username claim'} value={config.usernameClaim}/>
            <Row label={'Email claim'} value={config.emailClaim}/>
            <Row label={'Groups claim'} value={config.groupsClaim}/>
            <Row label={'Default role'} value={config.defaultRole}/>
            <Row
                label={'Group → role mapping'}
                value={(config.groupRoleMapping && config.groupRoleMapping.length > 0)
                    ? config.groupRoleMapping.map((m, i) => (
                        <div key={i}>{m.oidcGroup} → {m.ocRole}</div>
                    ))
                    : '—'}
            />
        </div>
    );
};

export default OidcConfig;

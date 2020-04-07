
/*
 * Copyright (C) <2020>  <becon GmbH>
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

export const DefaultAuthenticationType = {type: 'text', icon: 'perm_identity', defaultValue: 'NO CREDENTIAL TYPE',};

const Url = {key: 'url', type: 'text', maxLength: 256, icon: 'link', };

const ApiKey = {key: 'apikey', type: 'secret', maxLength: 256, icon: 'vpn_key', defaultValue: 'ag8vqhipf',};

const Login = {key: 'userlogin', type: 'text', maxLength: 256, icon: 'perm_identity', defaultValue: 'userlogin',};

const Username = {key: 'username', type: 'text', maxLength: 256, icon: 'perm_identity', defaultValue: 'username',};

const Secret = {key: '_secret',type: 'secret', maxLength: 256, icon: 'vpn_key', defaultValue: '1234',};

const RefreshToken = {key: 'refresh_token', type: 'secret', icon: 'vpn_key', defaultValue: '1234',};

const Password = {key: 'password',type: 'secret', maxLength: 256, icon: 'local_parking', defaultValue: '1234',};

const Token = {key: 'token', type: 'secret', icon: 'vpn_key', defaultValue: '1234',};

const Webservice = {key: 'webservice', type: 'text', maxLength: 256, icon: 'device_hub', defaultValue: 'webservice',};

/**
 * Authentication Types for connectors
 */
export const AuthenticationTypes = {
    url: Url,
    apikey: ApiKey,
    userlogin: Login,
    username: Username,
    password: Password,
    _secret: Secret,
    refresh_token: RefreshToken,
    token: Token,
    webservice: Webservice,
};
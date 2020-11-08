
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
/**
 * application constants
 */
export const isProd = process.env.NODE_ENV === 'production';
export const isDev = process.env.NODE_ENV === 'development';
export const hasHMR = process.env.NODE_HMR === 'true';
const nodeEnv = process.env.NODE_ENV;
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
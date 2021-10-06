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

const hasSocket = process.env.NODE_SOCKET === 'true';
const hasBrowserSync = process.env.NODE_BSYNC === 'true';
const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';
const isBuild = process.env.NODE_BUILD === '1';

/**
 * params from package.json scripts
 */
module.exports = {
    HAS_SOCKET: hasSocket,
    HAS_BROWSER_SYNC: hasBrowserSync,
    IS_PROD: isProd,
    IS_DEV: isDev,
    IS_BUILD: isBuild,
};
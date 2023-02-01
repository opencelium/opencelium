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

import io, {Socket} from 'socket.io-client';

export default class SocketIO{

    private static url: string = 'http://localhost:443/'

    static getInstance(query: any = {}) {
        return io(this.url, {
            auth: {
                'Authentication': 'Bearer sdasdasd',
            },
            extraHeaders: {
                'x-access-token': 'Bearer sdasdasd',
            },
            transports: ['websocket'],
            rejectUnauthorized: false,
            query,
            path: '/my_own_test',
        });
    }
}
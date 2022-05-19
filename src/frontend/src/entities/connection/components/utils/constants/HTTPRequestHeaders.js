/*
 *  Copyright (C) <2022>  <becon GmbH>
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

export const HTTPRequestHeaders = [
    {label: 'Accept', value: 'Accept', hint: 'Media type(s) that is/are acceptable for the response. See Content negotiation.'},
    {label: 'Accept-Charset', value: 'Accept-Charset', hint: 'Character sets that are acceptable.'},
    {label: 'Accept-Datetime', value: 'Accept-Datetime', hint: 'List of acceptable human languages for response. See Content negotiation.'},
    {label: 'Accept-Encoding', value: 'Accept-Encoding', hint: 'List of acceptable encodings. See HTTP compression.'},
    {label: 'Accept-Language', value: 'Accept-Language', hint: 'List of acceptable human languages for response. See Content negotiation.'},
    {label: 'Authorization', value: 'Authorization', hint: 'Authentication credentials for HTTP authentication.'},
    {label: 'Cache-Control', value: 'Cache-Control', hint: 'Used to specify directives that must be obeyed by all caching mechanisms along the request-response chain.'},
    {label: 'Connection', value: 'Cache-Control', hint: 'Control options for the current connection and list of hop-by-hop request fields.'},
    {label: 'Content-Length', value: 'Content-Length', hint: 'The length of the request body in octets (8-bit bytes).'},
    {label: 'Content-Type', value: 'Content-Type', hint: 'The Media type of the body of the request (used with POST and PUT requests).'},
    {label: 'Cookie', value: 'Cookie', hint: 'An HTTP cookie previously sent by the server with Set-Cookie.'},
    {label: 'Date', value: 'Date', hint: 'The date and time at which the message was originated (in "HTTP-date" format as defined by RFC 7231 Date/Time Formats).'},
    {label: 'Expect', value: 'Expect', hint: 'Indicates that particular server behaviors are required by the client.'},
    {label: 'From', value: 'From', hint: 'The email address of the user making the request.'},
    {label: 'Host', value: 'Host', hint: 'The domain name of the server (for virtual hosting), and the TCP port number on which the server is listening.'},
    {label: 'HTTP2-Settings', value: 'HTTP2-Settings', hint: 'A request that upgrades from HTTP/1.1 to HTTP/2 MUST include exactly one HTTP2-Setting header field.'},
    {label: 'If-Match', value: 'If-Match', hint: 'Only perform the action if the client supplied entity matches the same entity on the server.'},
    {label: 'If-Modified-Since', value: 'If-Modified-Since', hint: 'Allows a 304 Not Modified to be returned if content is unchanged.'},
    {label: 'If-None-Match', value: 'If-None-Match', hint: 'Allows a 304 Not Modified to be returned if content is unchanged, see HTTP ETag.'},
    {label: 'If-Range', value: 'If-Range', hint: 'If the entity is unchanged, send me the part(s) that I am missing; otherwise, send me the entire new entity.'},
    {label: 'If-Unmodified-Since', value: 'If-Unmodified-Since', hint: 'Only send the response if the entity has not been modified since a specific time.'},
    {label: 'Max-Forwards', value: 'Max-Forwards', hint: 'Limit the number of times the message can be forwarded through proxies or gateways.'},
    {label: 'Origin', value: 'Origin', hint: 'Initiates a request for cross-origin resource sharing (asks server for Access-Control-* response fields).'},
    {label: 'Pragma', value: 'Pragma', hint: 'Implementation-specific fields that may have various effects anywhere along the request-response chain.'},
    {label: 'Proxy-Authorization', value: 'Authorization credentials for connecting to a proxy.'},
    {label: 'Range', value: 'Range', hint: 'Request only part of an entity. Bytes are numbered from 0. See Byte serving.'},
    {label: 'Referer', value: 'Referer', hint: '\tThis is the address of the previous web page from which a link to the currently requested page was followed.'},
    {label: 'Transfer-Encoding', value: 'Transfer-Encoding', hint: 'The form of encoding used to safely transfer the entity to the user.'},
    {label: 'User-Agent', value: 'User-Agent', hint: 'The user agent string of the user agent.'},
    {label: 'Upgrade', value: 'From', hint: 'Ask the server to upgrade to another protocol.'},
    {label: 'Via', value: 'Via', hint: '\tInforms the server of proxies through which the request was sent.'},
    {label: 'Warning', value: 'Warning', hint: 'A general warning about possible problems with the entity body.'},
];
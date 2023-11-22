/*
 * // Copyright (C) <2020> <becon GmbH>
 * //
 * // This program is free software: you can redistribute it and/or modify
 * // it under the terms of the GNU General Public License as published by
 * // the Free Software Foundation, version 3 of the License.
 * //
 * // This program is distributed in the hope that it will be useful,
 * // but WITHOUT ANY WARRANTY; without even the implied warranty of
 * // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * // GNU General Public License for more details.
 * //
 * // You should have received a copy of the GNU General Public License
 * // along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

package com.becon.opencelium.backend.database.mongodb.entity;

import com.becon.opencelium.backend.invoker.entity.RequestInv;

import java.util.Map;

public class RequestMng {
    private String id;
    private String endpoint;
    private String method;
    private Map<String, String> header;
    private BodyMng body;

    public RequestMng() {
    }

    public RequestMng(RequestInv requestInv) {
        this.endpoint = requestInv.getEndpoint();
        this.method = requestInv.getMethod();
        this.header = requestInv.getHeader();
        if (requestInv.getBody() != null) {
            this.body = new BodyMng(requestInv.getBody());
        }
    }


    public String getEndpoint() {
        return endpoint;
    }

    public void setEndpoint(String endpoint) {
        this.endpoint = endpoint;
    }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public Map<String, String> getHeader() {
        return header;
    }

    public void setHeader(Map<String, String> header) {
        this.header = header;
    }

    public BodyMng getBody() {
        return body;
    }

    public void setBody(BodyMng body) {
        this.body = body;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }
}

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

package com.becon.opencelium.backend.resource.error;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.annotation.Resource;
import org.springframework.http.HttpStatus;

import java.util.Date;

@Resource
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResource {
    private Date timestamp;
    private int status;
    private String error;
    private String message;
    private String path;

    public ErrorResource(Exception e, HttpStatus status, String path){
        this.error = e.getMessage();
        this.message = status.getReasonPhrase().toUpperCase().replace(" ", "_");
        this.status = status.value();
        this.timestamp = new Date();
        this.path = path;
    }

    public ErrorResource(){
    }

    public Date getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Date timestamp) {
        this.timestamp = timestamp;
    }

    public void setStatus(HttpStatus status) {
        this.status = status.value();
    }

    public int getStatus() {
        return status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public void setError(String error) {
        this.error = error;
    }

    public String getError() {
        return error;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public String getPath() {
        return path;
    }
}

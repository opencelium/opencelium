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

package com.becon.opencelium.backend.resource.execution;

import com.becon.opencelium.backend.mysql.entity.LastExecution;
import org.springframework.hateoas.ResourceSupport;

import javax.annotation.Resource;

@Resource
public class LastExecutionResource extends ResourceSupport {

    private long lastExecutionId;
    private  ExecutionResource success;
    private  ExecutionResource fail;

    public LastExecutionResource(LastExecution lastExecution) {
        this.lastExecutionId = lastExecution.getId();
        if (lastExecution.getSuccessExecutionId() != 0){
            this.success = new ExecutionResource(lastExecution,  true);
        }

        if (lastExecution.getFailExecutionId() != 0){
            this.fail = new ExecutionResource(lastExecution,  false);
        }
    }

    public long getLastExecutionId() {
        return lastExecutionId;
    }

    public void setLastExecutionId(long lastExecutionId) {
        this.lastExecutionId = lastExecutionId;
    }

    public ExecutionResource getSuccess() {
        return success;
    }

    public void setSuccess(ExecutionResource success) {
        this.success = success;
    }

    public ExecutionResource getFail() {
        return fail;
    }

    public void setFail(ExecutionResource fail) {
        this.fail = fail;
    }
}

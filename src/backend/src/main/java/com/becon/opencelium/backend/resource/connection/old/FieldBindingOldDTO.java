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

package com.becon.opencelium.backend.resource.connection.old;


import com.becon.opencelium.backend.resource.connection.binding.LinkedFieldDTO;
import jakarta.annotation.Resource;

import java.util.List;

@Resource
public class FieldBindingOldDTO {
    private String nodeId;
    private List<LinkedFieldDTO> from;
    private EnhancementOldDTO enhancement;
    private List<LinkedFieldDTO> to;

    public List<LinkedFieldDTO> getFrom() {
        return from;
    }

    public void setFrom(List<LinkedFieldDTO> from) {
        this.from = from;
    }

    public EnhancementOldDTO getEnhancement() {
        return enhancement;
    }

    public void setEnhancement(EnhancementOldDTO enhancement) {
        this.enhancement = enhancement;
    }

    public List<LinkedFieldDTO> getTo() {
        return to;
    }

    public void setTo(List<LinkedFieldDTO> to) {
        this.to = to;
    }

    public String getNodeId() {
        return nodeId;
    }

    public void setNodeId(String nodeId) {
        this.nodeId = nodeId;
    }
}

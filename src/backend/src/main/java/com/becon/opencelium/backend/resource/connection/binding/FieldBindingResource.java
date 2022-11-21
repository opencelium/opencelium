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

package com.becon.opencelium.backend.resource.connection.binding;

import org.springframework.hateoas.RepresentationModel;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.List;

@Resource
public class FieldBindingResource extends RepresentationModel {
    private List<LinkedFieldResource> from = new ArrayList<>();
    private EnhancementResource enhancement;
    private List<LinkedFieldResource> to = new ArrayList<>();

    public List<LinkedFieldResource> getFrom() {
        return from;
    }

    public void setFrom(List<LinkedFieldResource> from) {
        this.from = from;
    }

    public EnhancementResource getEnhancement() {
        return enhancement;
    }

    public void setEnhancement(EnhancementResource enhancement) {
        this.enhancement = enhancement;
    }

    public List<LinkedFieldResource> getTo() {
        return to;
    }

    public void setTo(List<LinkedFieldResource> to) {
        this.to = to;
    }
}

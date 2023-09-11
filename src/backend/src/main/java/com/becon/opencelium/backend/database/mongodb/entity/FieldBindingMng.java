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


import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "field_binding")
public class FieldBindingMng {
    @Id
    private String id;
    @DBRef
    private List<LinkedFieldMng> from = new ArrayList<>();
    @DBRef
    private EnhancementMng enhancement;
    @DBRef
    private List<LinkedFieldMng> to = new ArrayList<>();

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public List<LinkedFieldMng> getFrom() {
        return from;
    }

    public void setFrom(List<LinkedFieldMng> from) {
        this.from = from;
    }

    public EnhancementMng getEnhancement() {
        return enhancement;
    }

    public void setEnhancement(EnhancementMng enhancement) {
        this.enhancement = enhancement;
    }

    public List<LinkedFieldMng> getTo() {
        return to;
    }

    public void setTo(List<LinkedFieldMng> to) {
        this.to = to;
    }
}

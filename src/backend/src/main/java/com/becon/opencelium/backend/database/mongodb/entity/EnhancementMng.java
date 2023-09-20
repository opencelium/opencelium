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

import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import org.springframework.data.mongodb.core.mapping.Field;


public class EnhancementMng {
    @Field(name = "enhancement_id")
    private Integer enhancementId;
    private String name;
    private String description;
    @Field(name = "expert_code")
    private String expertCode;
    @Field(name = "expert_var")
    private String expertVar;
    private String language;

    public EnhancementMng() {
    }

    public Integer getEnhancementId() {
        return enhancementId;
    }

    public void setEnhancementId(Integer enhancementId) {
        this.enhancementId = enhancementId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getExpertCode() {
        return expertCode;
    }

    public void setExpertCode(String expertCode) {
        this.expertCode = expertCode;
    }

    public String getExpertVar() {
        return expertVar;
    }

    public void setExpertVar(String expertVar) {
        this.expertVar = expertVar;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }
}

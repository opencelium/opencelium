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

import com.becon.opencelium.backend.mysql.entity.Enhancement;
import jakarta.annotation.Resource;


@Resource
public class EnhancementDTO {

    private Integer enhanceId;
    private String name;
    private String description;
    private String expertCode;
    private String expertVar;
    private SimpleCodeDTO simpleCode;
    private String language;

    public EnhancementDTO() {
    }

    public EnhancementDTO(Enhancement enhancement) {
        this.enhanceId = enhancement.getId();
        this.name = enhancement.getName();
        this.description = enhancement.getDescription();
        this.expertCode = enhancement.getExpertCode();
        this.expertVar = enhancement.getExpertVar();
        this.simpleCode = null;
        this.language = enhancement.getLanguage();
    }

    public Integer getEnhanceId() {
        return enhanceId;
    }

    public void setEnhanceId(Integer enhanceId) {
        this.enhanceId = enhanceId;
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

    public SimpleCodeDTO getSimpleCode() {
        return simpleCode;
    }

    public void setSimpleCode(SimpleCodeDTO simpleCode) {
        this.simpleCode = simpleCode;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }
}

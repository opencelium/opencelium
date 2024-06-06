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

import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import jakarta.annotation.Resource;


@Resource
public class EnhancementDTO {
    private String title;
    private String description;
    private String script;
    private String args;
    private SimpleCodeDTO simpleCode;
    private String language;

    public EnhancementDTO() {
    }

    public EnhancementDTO(Enhancement enhancement) {
        this.title = enhancement.getTitle();
        this.description = enhancement.getDescription();
        this.script = enhancement.getScript();
        this.args = enhancement.getArgs();
        this.simpleCode = null;
        this.language = enhancement.getLanguage();
    }
    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getScript() {
        return script;
    }

    public void setScript(String script) {
        this.script = script;
    }

    public String getArgs() {
        return args;
    }

    public void setArgs(String args) {
        this.args = args;
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

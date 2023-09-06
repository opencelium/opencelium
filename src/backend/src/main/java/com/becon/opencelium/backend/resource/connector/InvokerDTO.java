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

package com.becon.opencelium.backend.resource.connector;

import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.invoker.entity.RequiredData;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.annotation.Resource;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Resource
@JsonInclude(JsonInclude.Include.NON_NULL)
public class InvokerDTO {

    private String name;
    private String description;
    private String hint;
    private String icon;
    private String authType;
    private LinkedHashMap<String, String> requiredData;
    private List<FunctionDTO> operations;

    public InvokerDTO() {
    }

    public InvokerDTO(Invoker invoker) {
        URI uri = ServletUriComponentsBuilder.fromCurrentRequest().build().toUri();
        String imagePath = uri.getScheme() + "://" + uri.getAuthority() + PathConstant.IMAGES;

        this.name = invoker.getName();
        this.description = invoker.getDescription();
        this.hint = invoker.getHint();
        this.icon =imagePath + invoker.getIcon();
        this.authType = invoker.getAuthType();
        this.requiredData = invoker.getRequiredData().stream().filter(d->!d.getVisibility().equals("private"))
                .collect(Collectors.toMap(RequiredData::getName, RequiredData::getValue,
                        (existingValue, newValue) -> existingValue, LinkedHashMap::new));
        this.operations = invoker.getOperations().stream().map(FunctionDTO::new).collect(Collectors.toList());
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

    public String getHint() {
        return hint;
    }

    public void setHint(String hint) {
        this.hint = hint;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public Map<String, String> getRequiredData() {
        return requiredData;
    }

    public void setRequiredData(LinkedHashMap<String, String> requiredData) {
        this.requiredData = requiredData;
    }

    public String getAuthType() {
        return authType;
    }

    public void setAuthType(String authType) {
        this.authType = authType;
    }

    public List<FunctionDTO> getOperations() {
        return operations;
    }

    public void setOperations(List<FunctionDTO> operations) {
        this.operations = operations;
    }
}

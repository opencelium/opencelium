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

package com.becon.opencelium.backend.template.service;

import com.becon.opencelium.backend.resource.connection.ConnectionResource;
import com.becon.opencelium.backend.resource.template.TemplateResource;
import com.becon.opencelium.backend.template.entity.Template;

import java.util.List;
import java.util.Optional;

public interface TemplateService {
    TemplateResource toResource(Template template);

    Template toEntity(TemplateResource templateResource);

    void save(Template template);

    List<Template> findByFromInvokerAndToInvoker(String invoker, String invoker1);

    List<Template> findAll();

    void deleteById(String templateId);

    Optional<Template> findById(String id);
}

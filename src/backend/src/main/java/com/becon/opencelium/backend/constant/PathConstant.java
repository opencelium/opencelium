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

package com.becon.opencelium.backend.constant;

public interface PathConstant {
    String NEO4J = "com.becon.opencelium.backend.neo4j";
    String MONGODB = "com.becon.opencelium.backend.database.mongodb";
    String MYSQl = "com.becon.opencelium.backend.database.mysql";
    String ELASTICSEARCH = "com.becon.opencelium.backend.elasticsearch";

    String RESOURCES = "src/main/resources";
    String INVOKER = RESOURCES + "/invoker/";
    String LICENSE = RESOURCES + "/license/";
    String TEMPLATE = "src/main/resources/templates/";
    String ICONS = "src/main/resources/icon/";
    String APP_DEFAULT_YML = "src/main/resources/application_default.yml";
    String INSTRUCTION = "src/backend/assistant/instruction/update_instruction.html";
    String IMAGES = "/api/storage/files/";
    String VERSIONS = "versions/";
    String ASSISTANT = "assistant/";
    String LIBS = "build/libs/";
}

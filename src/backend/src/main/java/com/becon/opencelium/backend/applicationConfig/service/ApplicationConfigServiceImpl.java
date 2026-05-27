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

package com.becon.opencelium.backend.applicationConfig.service;

import com.becon.opencelium.backend.applicationConfig.dto.ApplicationConfigResponse;
import com.becon.opencelium.backend.exception.ApplicationConfigReadException;
import com.becon.opencelium.backend.exception.ApplicationConfigWriteException;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class ApplicationConfigServiceImpl implements ApplicationConfigService {

    private final YamlConfigReader reader;
    private final YamlConfigWriter writer;
    private final AtomicFileWriter fileWriter;
    private final String configuredPath;

    public ApplicationConfigServiceImpl(
            YamlConfigReader reader,
            YamlConfigWriter writer,
            AtomicFileWriter fileWriter,
            @Value("${opencelium.config.file-path:./application.yml}") String configuredPath
    ) {
        this.reader = reader;
        this.writer = writer;
        this.fileWriter = fileWriter;
        this.configuredPath = configuredPath;
    }

    @Override
    public ApplicationConfigResponse read() {
        String content = readContent();
        YamlConfigReader.ReadResult result = reader.read(content);
        return new ApplicationConfigResponse(result.data(), result.comments());
    }

    @Override
    public void patch(JsonNode payload) {
        if (payload == null || !payload.isObject()) {
            throw new ApplicationConfigWriteException("Patch payload must be a JSON object");
        }
        Path target = resolveWritablePath();
        String original = readContent();
        String merged = writer.merge(original, payload);
        fileWriter.write(target, merged);
    }

    private String readContent() {
        Path filesystemPath = Paths.get(configuredPath);
        if (Files.exists(filesystemPath)) {
            try {
                return Files.readString(filesystemPath, StandardCharsets.UTF_8);
            } catch (IOException e) {
                throw new ApplicationConfigReadException("Failed to read " + filesystemPath, e);
            }
        }
        try {
            return new String(
                    new ClassPathResource("application.yml").getInputStream().readAllBytes(),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new ApplicationConfigReadException(
                    "Configuration file not found at " + configuredPath + " or on classpath", e
            );
        }
    }

    private Path resolveWritablePath() {
        Path filesystemPath = Paths.get(configuredPath);
        if (!Files.exists(filesystemPath)) {
            throw new ApplicationConfigWriteException(
                    "Cannot write to " + configuredPath + ": file does not exist on disk. "
                            + "Configure opencelium.config.file-path to point at a writable copy."
            );
        }
        return filesystemPath;
    }
}

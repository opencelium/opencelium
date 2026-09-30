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

package com.becon.opencelium.backend.invoker.service;

import com.becon.opencelium.backend.constant.props.InvokerRepositoryProps;
import com.becon.opencelium.backend.database.mysql.service.InvokerSyncService;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.ByteArrayInputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class InvokerRepositoryServiceImp implements InvokerRepositoryService {

    private static final Logger log = LoggerFactory.getLogger(InvokerRepositoryServiceImp.class);

    private final RestTemplate restTemplate;
    private final InvokerRepositoryProps props;
    private final InvokerService invokerService;
    private final InvokerSyncService invokerSyncService;

    public InvokerRepositoryServiceImp(
            @Qualifier("invokerRepositoryRestTemplate") RestTemplate restTemplate,
            InvokerRepositoryProps props,
            @Qualifier("invokerServiceImp") InvokerService invokerService,
            @Qualifier("invokerSyncServiceImp") InvokerSyncService invokerSyncService) {
        this.restTemplate = restTemplate;
        this.props = props;
        this.invokerService = invokerService;
        this.invokerSyncService = invokerSyncService;
    }

    @Override
    public DownloadResult downloadAll() {
        JsonNode listing = fetchListing();

        List<String> installed = new ArrayList<>();
        List<FailedFile> failed = new ArrayList<>();
        for (JsonNode entry : listing) {
            String fileName = entry.path("name").asText("");
            if (!isXmlFile(entry, fileName)) {
                continue;
            }
            try {
                installed.add(install(entry, fileName));
            } catch (Exception e) {
                log.warn("Failed to install invoker file '{}' from the repository", fileName, e);
                failed.add(new FailedFile(fileName, reasonOf(e)));
            }
        }
        return new DownloadResult(installed, failed);
    }

    private JsonNode fetchListing() {
        String url = UriComponentsBuilder.fromUriString(props.url())
                .queryParam("ref", props.branch())
                .toUriString();
        JsonNode listing;
        try {
            listing = restTemplate.getForObject(url, JsonNode.class);
        } catch (RestClientException e) {
            throw new GeneralServiceException(HttpStatus.BAD_GATEWAY, "INVOKER_REPOSITORY_UNAVAILABLE",
                    "Failed to read the invoker repository folder: " + e.getMessage());
        }
        if (listing == null || !listing.isArray()) {
            throw new GeneralServiceException(HttpStatus.BAD_GATEWAY, "INVOKER_REPOSITORY_UNAVAILABLE",
                    "The configured invoker repository url did not return a folder listing. "
                            + "Please point 'opencelium.invoker-repository.url' at a GitHub Contents API folder.");
        }
        return listing;
    }

    private static boolean isXmlFile(JsonNode entry, String fileName) {
        return "file".equals(entry.path("type").asText())
                && fileName.toLowerCase(Locale.ROOT).endsWith(".xml");
    }

    /**
     * Runs one repository file through the regular upload pipeline. The name policy, the
     * shadowing guard and the write itself are all enforced by
     * {@link InvokerService#storeInvokerFile}, exactly as for a manual upload.
     *
     * @return the name of the installed invoker
     */
    private String install(JsonNode entry, String fileName) {
        String downloadUrl = entry.path("download_url").asText("");
        if (downloadUrl.isEmpty()) {
            throw new GeneralServiceException(HttpStatus.BAD_GATEWAY, "INVOKER_REPOSITORY_UNAVAILABLE",
                    "The repository listing carries no download url for this file.");
        }

        String targetFileName = invokerService.toStoredFileName(fileName);
        byte[] content;
        try {
            content = restTemplate.getForObject(downloadUrl, byte[].class);
        } catch (RestClientException e) {
            throw new GeneralServiceException(HttpStatus.BAD_GATEWAY, "INVOKER_REPOSITORY_UNAVAILABLE",
                    "Failed to download the file: " + e.getMessage());
        }
        if (content == null || content.length == 0) {
            throw new GeneralServiceException(HttpStatus.BAD_GATEWAY, "INVOKER_REPOSITORY_UNAVAILABLE",
                    "The downloaded file is empty.");
        }

        String name = null;
        try {
            name = invokerService.storeInvokerFile(new ByteArrayInputStream(content), targetFileName);
            invokerSyncService.updateSync(name);
            return name;
        } catch (GeneralServiceException e) {
            // the invoker was rejected before anything was written - report the reason as it is
            throw e;
        } catch (Exception e) {
            invokerService.deleteQuietly(name);
            throw e;
        }
    }

    private static String reasonOf(Exception e) {
        String message = e.getMessage();
        return message == null || message.isBlank() ? e.getClass().getSimpleName() : message;
    }
}

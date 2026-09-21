package com.becon.opencelium.backend.unit.invoker;

import com.becon.opencelium.backend.constant.props.InvokerRepositoryProps;
import com.becon.opencelium.backend.database.mysql.service.InvokerSyncService;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.invoker.service.InvokerRepositoryService.DownloadResult;
import com.becon.opencelium.backend.invoker.service.InvokerRepositoryServiceImp;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("InvokerRepositoryServiceImp — unit")
class InvokerRepositoryServiceImpTest {

    private static final String REPOSITORY_URL = "https://api.example.com/contents/invoker";
    private static final String BRANCH = "dev";
    private static final String LISTING_URL = REPOSITORY_URL + "?ref=" + BRANCH;

    private static final ObjectMapper JSON = new ObjectMapper();

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private InvokerService invokerService;

    @Mock
    private InvokerSyncService invokerSyncService;

    private InvokerRepositoryServiceImp repositoryService;

    @BeforeEach
    void setUp() {
        repositoryService = new InvokerRepositoryServiceImp(
                restTemplate,
                new InvokerRepositoryProps(REPOSITORY_URL, BRANCH),
                invokerService,
                invokerSyncService);
    }

    // ── downloadAll — success ─────────────────────────────────────────────────

    @Test
    void downloadAllInstallsEveryFileWhenTheWholeListingSucceeds() {
        givenListing(
                fileEntry("jira.xml", "https://raw.example.com/jira.xml"),
                fileEntry("github.xml", "https://raw.example.com/github.xml"));
        givenDownload("https://raw.example.com/jira.xml", "<invoker/>");
        givenDownload("https://raw.example.com/github.xml", "<invoker/>");
        givenStoredAs("jira.xml", "jira");
        givenStoredAs("github.xml", "github");

        DownloadResult result = repositoryService.downloadAll();

        assertThat(result.installed()).containsExactly("jira", "github");
        assertThat(result.failed()).isEmpty();
        verify(invokerSyncService).updateSync("jira");
        verify(invokerSyncService).updateSync("github");
    }

    @Test
    void downloadAllSkipsEntriesWhenTheyAreNotXmlFiles() {
        ObjectNode readme = fileEntry("README.md", "https://raw.example.com/README.md");
        ObjectNode folder = fileEntry("nested.xml", "https://raw.example.com/nested.xml");
        folder.put("type", "dir");
        givenListing(readme, folder, fileEntry("jira.xml", "https://raw.example.com/jira.xml"));
        givenDownload("https://raw.example.com/jira.xml", "<invoker/>");
        givenStoredAs("jira.xml", "jira");

        DownloadResult result = repositoryService.downloadAll();

        assertThat(result.installed()).containsExactly("jira");
        assertThat(result.failed()).isEmpty();
        verify(restTemplate, never()).getForObject("https://raw.example.com/README.md", byte[].class);
        verify(restTemplate, never()).getForObject("https://raw.example.com/nested.xml", byte[].class);
    }

    @Test
    void downloadAllReturnsEmptyResultWhenTheFolderIsEmpty() {
        givenListing();

        DownloadResult result = repositoryService.downloadAll();

        assertThat(result.installed()).isEmpty();
        assertThat(result.failed()).isEmpty();
    }

    // ── downloadAll — per-file isolation ──────────────────────────────────────

    @Test
    void downloadAllInstallsTheRemainingFilesWhenOneFileIsRejected() {
        givenListing(
                fileEntry("bad.xml", "https://raw.example.com/bad.xml"),
                fileEntry("jira.xml", "https://raw.example.com/jira.xml"));
        givenDownload("https://raw.example.com/bad.xml", "<invoker/>");
        givenDownload("https://raw.example.com/jira.xml", "<invoker/>");
        when(invokerService.toStoredFileName("bad.xml")).thenReturn("bad.xml");
        when(invokerService.storeInvokerFile(any(InputStream.class), eq("bad.xml")))
                .thenThrow(new GeneralServiceException(HttpStatus.CONFLICT, "INVOKER_ALREADY_EXISTS",
                        "Invoker 'bad' already exists."));
        givenStoredAs("jira.xml", "jira");

        DownloadResult result = repositoryService.downloadAll();

        assertThat(result.installed()).containsExactly("jira");
        assertThat(result.failed()).hasSize(1);
        assertThat(result.failed().get(0).fileName()).isEqualTo("bad.xml");
        assertThat(result.failed().get(0).reason()).contains("already exists");
    }

    @Test
    void downloadAllReportsFailureWhenTheDownloadUrlIsMissing() {
        ObjectNode entry = fileEntry("jira.xml", "");
        entry.remove("download_url");
        givenListing(entry);

        DownloadResult result = repositoryService.downloadAll();

        assertThat(result.installed()).isEmpty();
        assertThat(result.failed()).hasSize(1);
        assertThat(result.failed().get(0).fileName()).isEqualTo("jira.xml");
    }

    @Test
    void downloadAllReportsFailureWhenTheDownloadedFileIsEmpty() {
        givenListing(fileEntry("jira.xml", "https://raw.example.com/jira.xml"));
        when(invokerService.toStoredFileName("jira.xml")).thenReturn("jira.xml");
        when(restTemplate.getForObject("https://raw.example.com/jira.xml", byte[].class))
                .thenReturn(new byte[0]);

        DownloadResult result = repositoryService.downloadAll();

        assertThat(result.installed()).isEmpty();
        assertThat(result.failed()).hasSize(1);
        assertThat(result.failed().get(0).reason()).contains("empty");
    }

    @Test
    void downloadAllRollsBackTheInvokerWhenSyncFailsAfterTheFileWasStored() {
        givenListing(fileEntry("jira.xml", "https://raw.example.com/jira.xml"));
        givenDownload("https://raw.example.com/jira.xml", "<invoker/>");
        givenStoredAs("jira.xml", "jira");
        doThrow(new RuntimeException("sync table unavailable"))
                .when(invokerSyncService).updateSync("jira");

        DownloadResult result = repositoryService.downloadAll();

        assertThat(result.installed()).isEmpty();
        assertThat(result.failed()).hasSize(1);
        verify(invokerService).deleteQuietly("jira");
    }

    // ── downloadAll — listing failures ────────────────────────────────────────

    @Test
    void downloadAllThrowsBadGatewayWhenTheListingCannotBeFetched() {
        when(restTemplate.getForObject(LISTING_URL, JsonNode.class))
                .thenThrow(new ResourceAccessException("connection refused"));

        assertThatThrownBy(() -> repositoryService.downloadAll())
                .isInstanceOf(GeneralServiceException.class)
                .satisfies(e -> assertThat(((GeneralServiceException) e).getStatus())
                        .isEqualTo(HttpStatus.BAD_GATEWAY));
    }

    @Test
    void downloadAllThrowsBadGatewayWhenTheListingIsNotAFolder() {
        when(restTemplate.getForObject(LISTING_URL, JsonNode.class))
                .thenReturn(JSON.createObjectNode());

        assertThatThrownBy(() -> repositoryService.downloadAll())
                .isInstanceOf(GeneralServiceException.class)
                .hasMessageContaining("folder listing");
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private void givenListing(ObjectNode... entries) {
        ArrayNode listing = JSON.createArrayNode();
        for (ObjectNode entry : entries) {
            listing.add(entry);
        }
        when(restTemplate.getForObject(LISTING_URL, JsonNode.class)).thenReturn(listing);
    }

    private void givenDownload(String downloadUrl, String content) {
        when(restTemplate.getForObject(downloadUrl, byte[].class))
                .thenReturn(content.getBytes(StandardCharsets.UTF_8));
    }

    private void givenStoredAs(String fileName, String invokerName) {
        when(invokerService.toStoredFileName(fileName)).thenReturn(fileName);
        when(invokerService.storeInvokerFile(any(InputStream.class), eq(fileName)))
                .thenReturn(invokerName);
    }

    private static ObjectNode fileEntry(String name, String downloadUrl) {
        ObjectNode entry = JSON.createObjectNode();
        entry.put("type", "file");
        entry.put("name", name);
        entry.put("download_url", downloadUrl);
        return entry;
    }
}

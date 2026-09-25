package com.becon.opencelium.backend.unit.invoker;

import com.becon.opencelium.backend.database.mysql.service.InvokerSyncService;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.invoker.InvokerContainer;
import com.becon.opencelium.backend.invoker.service.InvokerServiceImp;
import com.becon.opencelium.backend.utility.InvokerNameUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpStatus;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;

import static com.becon.opencelium.backend.testutil.fixture.InvokerFixture.DELL_WARRANTY;
import static com.becon.opencelium.backend.testutil.fixture.InvokerFixture.aDellWarrantyInvoker;
import static com.becon.opencelium.backend.testutil.fixture.InvokerFixture.anInvokerDocumentDeclaring;
import static com.becon.opencelium.backend.testutil.fixture.InvokerFixture.anInvokerFileDeclaring;
import static com.becon.opencelium.backend.testutil.fixture.InvokerFixture.anInvokerFileStreamDeclaring;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ExtendWith(MockitoExtension.class)
@DisplayName("InvokerServiceImp — unit")
class InvokerServiceImpTest {

    @TempDir
    Path invokerFolder;

    @Mock
    private InvokerSyncService invokerSyncService;

    private InvokerContainer container;
    private InvokerServiceImp invokerService;

    @BeforeEach
    void setUp() {
        container = new InvokerContainer(new HashMap<>());
        invokerService = new InvokerServiceImp(container, invokerSyncService, invokerFolder);
    }

    // ── existsByFileName ──────────────────────────────────────────────────────

    @ParameterizedTest
    @ValueSource(strings = {"dellwarranty.xml", "DellWarranty.xml", "DELLWARRANTY.XML"})
    void existsByFileNameReportsTheFileRegardlessOfCase(String fileName) throws IOException {
        writeInvokerFile("dellwarranty.xml", DELL_WARRANTY);

        assertThat(invokerService.existsByFileName(fileName)).isTrue();
    }

    @Test
    void existsByFileNameReportsAFileWhoseNameCarriesADot() throws IOException {
        writeInvokerFile("api.v2.xml", "api.v2");

        assertThat(invokerService.existsByFileName("api.v2.xml")).isTrue();
        assertThat(invokerService.existsByFileName("API.V2.XML")).isTrue();
    }

    @Test
    void existsByFileNameReturnsFalseWithoutTheXmlExtension() throws IOException {
        writeInvokerFile("dellwarranty.xml", DELL_WARRANTY);

        // an invoker can only be stored as '<name>.xml', so there is nothing to match without it
        assertThat(invokerService.existsByFileName("dellwarranty")).isFalse();
    }

    @Test
    void existsByFileNameReturnsFalseWhenNoSuchFileIsStored() throws IOException {
        writeInvokerFile("dellwarranty.xml", DELL_WARRANTY);

        assertThat(invokerService.existsByFileName("jira.xml")).isFalse();
        assertThat(invokerService.existsByFileName("")).isFalse();
        assertThat(invokerService.existsByFileName(null)).isFalse();
    }

    // ── deleteInvokerFile ─────────────────────────────────────────────────────

    @Test
    void deleteInvokerFileRemovesTheFileWhoseDeclaredNameDiffersOnlyInCase() throws IOException {
        writeInvokerFile("dellwarranty.xml", DELL_WARRANTY);
        container.add(DELL_WARRANTY, aDellWarrantyInvoker());

        invokerService.deleteInvokerFile("dell warranty");

        assertThat(invokerFolder.resolve("dellwarranty.xml")).doesNotExist();
        assertThat(container.getInvokers()).isEmpty();
    }

    // ── containerize ──────────────────────────────────────────────────────────

    @Test
    void existsByNameFindsAnInvokerLoadedFromDiskIgnoringCase() throws IOException {
        writeInvokerFile("dellwarranty.xml", DELL_WARRANTY);

        invokerService.refresh();

        assertThat(invokerService.existsByName("DELL WARRANTY")).isTrue();
        assertThat(invokerService.findByName("dell warranty").getName()).isEqualTo(DELL_WARRANTY);
    }

    // ── createInvokerFile ─────────────────────────────────────────────────────

    @Test
    void createInvokerFileStoresTheNormalizedNameInBothTheFileNameAndTheDocument() throws IOException {
        String name = invokerService.createInvokerFile(anInvokerDocumentDeclaring("  Dell   Warranty "));

        assertThat(name).isEqualTo(DELL_WARRANTY);
        // the file name, the '<name>' node and the container key must not drift apart
        assertThat(invokerFolder.resolve("Dell Warranty.xml")).exists();
        assertThat(Files.readString(invokerFolder.resolve("Dell Warranty.xml"))).contains("<name>" + DELL_WARRANTY + "</name>");
        assertThat(container.existsByName(DELL_WARRANTY)).isTrue();
    }

    @Test
    void createInvokerFileWritesNothingWhenTheNameBreaksThePolicy() {
        assertThatThrownBy(() -> invokerService.createInvokerFile(anInvokerDocumentDeclaring("../../etc/passwd")))
                .isInstanceOf(GeneralServiceException.class)
                .extracting(e -> ((GeneralServiceException) e).getError())
                .isEqualTo(InvokerNameUtils.INVALID_NAME_ERROR);

        assertThat(invokerFolder).isEmptyDirectory();
        assertThat(container.getInvokers()).isEmpty();
    }

    @Test
    void createInvokerFileRejectsANameAlreadyTakenByAnotherCase() throws IOException {
        writeInvokerFile("dellwarranty.xml", DELL_WARRANTY);
        invokerService.refresh();

        assertThatThrownBy(() -> invokerService.createInvokerFile(anInvokerDocumentDeclaring("DELL WARRANTY")))
                .isInstanceOf(GeneralServiceException.class)
                .extracting(e -> ((GeneralServiceException) e).getError(),
                        e -> ((GeneralServiceException) e).getStatus())
                .containsExactly("INVOKER_ALREADY_EXISTS", HttpStatus.CONFLICT);

        assertThat(invokerFolder.resolve("DELL WARRANTY.xml")).doesNotExist();
    }

    // ── storeInvokerFile ──────────────────────────────────────────────────────

    @Test
    void storeInvokerFileWritesTheUploadedFileAndRegistersTheInvoker() {
        String name = invokerService.storeInvokerFile(anInvokerFileStreamDeclaring(" Dell  Warranty "), "anything.xml");

        assertThat(name).isEqualTo(DELL_WARRANTY);
        assertThat(invokerFolder.resolve("anything.xml")).exists();
        assertThat(container.existsByName(DELL_WARRANTY)).isTrue();
    }

    @Test
    void storeInvokerFileReplacesTheFileThatAlreadyCarriesTheInvoker() throws IOException {
        writeInvokerFile("dellwarranty.xml", DELL_WARRANTY);
        invokerService.refresh();

        String name = invokerService.storeInvokerFile(anInvokerFileStreamDeclaring(DELL_WARRANTY), "DELLWARRANTY.XML");

        assertThat(name).isEqualTo(DELL_WARRANTY);
        assertThat(invokerFolder.toFile().list()).containsExactly("dellwarranty.xml");
    }

    @Test
    void storeInvokerFileRefusesASecondFileDeclaringTheSameInvoker() throws IOException {
        writeInvokerFile("dellwarranty.xml", DELL_WARRANTY);
        invokerService.refresh();

        assertThatThrownBy(() -> invokerService.storeInvokerFile(
                anInvokerFileStreamDeclaring("dell warranty"), "copy.xml"))
                .isInstanceOf(GeneralServiceException.class)
                .hasMessageContaining("dellwarranty.xml")
                .extracting(e -> ((GeneralServiceException) e).getStatus())
                .isEqualTo(HttpStatus.CONFLICT);

        assertThat(invokerFolder.resolve("copy.xml")).doesNotExist();
    }

    @Test
    void storeInvokerFileRejectsAnInvokerThatDeclaresNoNameAtAll() {
        InputStream withoutNameNode =
                new ByteArrayInputStream("<invoker type=\"json\"/>".getBytes(StandardCharsets.UTF_8));

        assertThatThrownBy(() -> invokerService.storeInvokerFile(withoutNameNode, "jira.xml"))
                .isInstanceOf(GeneralServiceException.class)
                .extracting(e -> ((GeneralServiceException) e).getError())
                .isEqualTo(InvokerNameUtils.INVALID_NAME_ERROR);

        assertThat(invokerFolder).isEmptyDirectory();
    }

    @Test
    void storeInvokerFileWritesNothingWhenTheNameBreaksThePolicy() {
        assertThatThrownBy(() -> invokerService.storeInvokerFile(
                anInvokerFileStreamDeclaring("Jira/Confluence"), "jira.xml"))
                .isInstanceOf(GeneralServiceException.class)
                .extracting(e -> ((GeneralServiceException) e).getError())
                .isEqualTo(InvokerNameUtils.INVALID_NAME_ERROR);

        assertThat(invokerFolder).isEmptyDirectory();
    }

    // ── toStoredFileName ──────────────────────────────────────────────────────

    @ParameterizedTest
    @CsvSource(delimiter = '|', value = {
            "jira.xml|jira.xml",
            "invokers/jira.xml|jira.xml",
            "../../etc/jira.xml|jira.xml",
            "invokers\\jira.xml|jira.xml",
            "  jira.xml  |jira.xml",
            "JIRA.XML|JIRA.XML"
    })
    void toStoredFileNameKeepsOnlyThePlainFileName(String given, String expected) {
        assertThat(invokerService.toStoredFileName(given)).isEqualTo(expected);
    }

    @ParameterizedTest
    @ValueSource(strings = {"jira.txt", "jira", "..", ".", "invokers/", "   "})
    void toStoredFileNameRejectsAnythingThatIsNotAPlainXmlFile(String fileName) {
        assertThatThrownBy(() -> invokerService.toStoredFileName(fileName))
                .isInstanceOf(GeneralServiceException.class)
                .extracting(e -> ((GeneralServiceException) e).getError())
                .isEqualTo("INVALID_FILE_NAME");
    }

    // ── deleteQuietly ─────────────────────────────────────────────────────────

    @Test
    void deleteQuietlySwallowsTheFailureWhenNoSuchInvokerIsStored() {
        assertThatCode(() -> invokerService.deleteQuietly("Jira")).doesNotThrowAnyException();
        assertThatCode(() -> invokerService.deleteQuietly(null)).doesNotThrowAnyException();
    }

    private void writeInvokerFile(String fileName, String invokerName) throws IOException {
        Files.writeString(invokerFolder.resolve(fileName), anInvokerFileDeclaring(invokerName));
    }
}

package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.database.mysql.entity.InvokerSync;
import com.becon.opencelium.backend.database.mysql.repository.InvokerSyncRepository;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.subscription.remoteapi.RemoteApiFactory;
import com.becon.opencelium.backend.subscription.remoteapi.enums.ApiModule;
import com.becon.opencelium.backend.subscription.remoteapi.enums.ApiType;
import com.becon.opencelium.backend.subscription.remoteapi.module.InvokerModule;
import com.becon.opencelium.backend.utility.crypto.HmacUtility;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.w3c.dom.Document;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathFactory;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Objects;
import java.util.Optional;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Service
public class InvokerSyncServiceImp implements InvokerSyncService {
    private final InvokerModule invokerModule;
    private final InvokerService invokerService;
    private final InvokerSyncRepository invokerSyncRepository;

    @Value("${opencelium.online_services.invoker_sync.active:false}")
    private boolean active;
    private static final Path INVOKER_FILES_PATH = Paths.get(PathConstant.INVOKER);
    private static final Logger logger = LoggerFactory.getLogger(InvokerSyncServiceImp.class);

    public InvokerSyncServiceImp(InvokerService invokerService, InvokerSyncRepository invokerSyncRepository) {
        this.invokerService = invokerService;
        this.invokerSyncRepository = invokerSyncRepository;
        this.invokerModule = (InvokerModule) RemoteApiFactory.createInstance(ApiType.SERVICE_PORTAL).getModule(ApiModule.INVOKER);
    }

    @Override
    public void updateSync(String invokerName) {
        File invokerFile = invokerService.findFileByInvokerName(invokerName);
        Path filepath = invokerFile.toPath();

        try {
            byte[] xmlBytes = Files.readAllBytes(filepath);

            String ocFileName = filepath.getFileName().toString();
            String contentHmac = HmacUtility.encode(xmlBytes);

            InvokerSync sync = new InvokerSync();
            Optional<InvokerSync> optionalSync = invokerSyncRepository.findByInvokerName(invokerName);
            if (optionalSync.isPresent()) {
                sync = optionalSync.get();

                sync.setOcInvokerFileName(ocFileName);
                sync.setInvokerContentHmac(contentHmac);
                sync.setManuallyModified(false);
            } else {
                sync.setInvokerName(invokerName);
                sync.setOcInvokerFileName(ocFileName);
                sync.setSpInvokerFileName(ocFileName); // replaced when invoker file is loaded from service portal
                sync.setInvokerContentHmac(contentHmac);
                sync.setManuallyModified(false);
            }

            saveOrUpdate(sync);
        } catch (Exception e) {
            logger.warn("Failed to update content hmac for invoker = " + invokerName, e);
            throw new RuntimeException(e);
        }
    }

    @Override
    public void delete(String invokerName) {
        invokerSyncRepository.findByInvokerName(invokerName)
                .ifPresent(invokerSyncRepository::delete);
    }

    @Override
    public boolean isManuallyModified(String invokerName) {
        return invokerSyncRepository.findByInvokerName(invokerName)
                .map(InvokerSync::isManuallyModified)
                .orElse(false);
    }

    @Override
    @Transactional
    public void forceSync(String invokerName) {
        InvokerSync sync = invokerSyncRepository.findByInvokerName(invokerName)
                .orElseThrow(() -> new RuntimeException("Invoker with name = '" + invokerName + "' not found."));

        // load invoker file by its 'service portal fileName' from service portal
        byte[] xmlBytes = invokerModule.getInvokerFileByName(sync.getSpInvokerFileName()).getBody();
        Objects.requireNonNull(xmlBytes);

        try {
            // save invoker file and calculate contents hmac:
            String ocFileName = sync.getOcInvokerFileName();
            String contentHmac = saveOrUpdateInvokerFile(xmlBytes, ocFileName);

            // update sync date for updated file
            sync.setInvokerContentHmac(contentHmac);
            sync.setManuallyModified(false);

            saveOrUpdate(sync);
        } catch (Exception e) {
            logger.warn("Failed to force sync invoker file", e);
            throw new RuntimeException(e);
        }
    }


    // SYSTEM LEVEL METHODS
    @EventListener(ApplicationReadyEvent.class)
    void init() {
        recalculateSyncData();
    }

    @Transactional
    @Scheduled(cron = "${opencelium.online_services.invoker_sync.time}")
    void syncInvokers() {
        if (!active) {
            return;
        }

        recalculateSyncData();

        // load invoker files as zip from service portal
        byte[] zipBytes = invokerModule.getAllInvokerFiles().getBody();
        Objects.requireNonNull(zipBytes);

        // update invoker files that have not been modified manually
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            ZipEntry entry; // = invoker file
            while ((entry = zis.getNextEntry()) != null) {
                if (entry.getName().endsWith(".xml")) {
                    // read bytes of invoker file
                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    byte[] buffer = new byte[4096];
                    int len;
                    while ((len = zis.read(buffer)) > 0) {
                        baos.write(buffer, 0, len);
                    }
                    byte[] xmlBytes = baos.toByteArray();

                    // extract required fields
                    String invokerName = extractInvokerName(xmlBytes);
                    String spFileName = entry.getName();

                    // after calling recalculateSyncData() we have all existing invoker names in our table,
                    // so we just need to check this table if we have invoker file for a specific invokerName
                    InvokerSync sync = new InvokerSync();
                    Optional<InvokerSync> optionalSync = invokerSyncRepository.findByInvokerName(invokerName);
                    if (optionalSync.isPresent()) {
                        sync = optionalSync.get();

                        if (!sync.isManuallyModified()) {
                            String contentHmac = saveOrUpdateInvokerFile(xmlBytes, sync.getOcInvokerFileName());

                            sync.setInvokerContentHmac(contentHmac);
                        }
                    } else {
                        // we get new invoker file, so create new file with the same name
                        String contentHmac = saveOrUpdateInvokerFile(xmlBytes, spFileName);

                        sync.setInvokerName(invokerName);
                        sync.setOcInvokerFileName(spFileName);
                        sync.setInvokerContentHmac(contentHmac);
                        sync.setManuallyModified(false);
                    }
                    // store actual value of invoker file name in Service Portal
                    sync.setSpInvokerFileName(spFileName);

                    saveOrUpdate(sync);
                }
            }

            // update invoker container
            invokerService.refresh();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }


    // PRIVATE METHODS
    private void saveOrUpdate(InvokerSync sync) {
        invokerSyncRepository.save(sync);
    }

    private void recalculateSyncData() {
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(INVOKER_FILES_PATH, "*.xml")) {
            for (Path entry : stream) {
                byte[] xmlBytes = Files.readAllBytes(entry);

                String invokerName = extractInvokerName(xmlBytes);
                String ocFileName = entry.getFileName().toString();
                String contentHmac = HmacUtility.encode(xmlBytes);

                InvokerSync sync = new InvokerSync();
                Optional<InvokerSync> optionalSync = invokerSyncRepository.findByInvokerName(invokerName);
                if (optionalSync.isPresent()) {
                    sync = optionalSync.get();

                    // if we have different hmac for invoker file content it means admin changed this invoker file manually
                    // in this case we only set manually_modified to true to just inform via UI,
                    // and we update hmac value to new one when user does force sync this invoker file
                    boolean isContentChanged = !Objects.equals(contentHmac, sync.getInvokerContentHmac());
                    sync.setManuallyModified(isContentChanged);
                    sync.setOcInvokerFileName(ocFileName);
                } else {
                    sync.setInvokerName(invokerName);
                    sync.setOcInvokerFileName(ocFileName);
                    sync.setSpInvokerFileName(ocFileName); // will be replaced with actual fileName in syncInvokers()
                    sync.setInvokerContentHmac(contentHmac);
                    sync.setManuallyModified(false);
                }

                saveOrUpdate(sync);
            }
        } catch (Exception e) {
            logger.warn("Failed to calculate sync data", e);
            throw new RuntimeException(e);
        }
    }

    private static String extractInvokerName(byte[] xmlBytes) throws Exception {
        ByteArrayInputStream inputStream = new ByteArrayInputStream(xmlBytes);

        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(false);
        DocumentBuilder builder = factory.newDocumentBuilder();
        Document doc = builder.parse(inputStream);

        XPathFactory xpathFactory = XPathFactory.newInstance();
        XPath xpath = xpathFactory.newXPath();
        String expression = "//invoker/name";

        return xpath.evaluate(expression, doc);
    }

    /**
     * his method is used when we get xmlBytes from Service Portal
     * Saves or Updates invoker file by its name, then calculates content hmac
     * @param xmlBytes - byte array of invoker file from Service Portal
     * @param ocFileName - invoker files name in opencelium (might be different from Service Portal)
     * @return stored file contents' hmac
     * @throws Exception
     */
    private String saveOrUpdateInvokerFile(byte[] xmlBytes, String ocFileName) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(false);
        DocumentBuilder builder = factory.newDocumentBuilder();
        Document document = builder.parse(new ByteArrayInputStream(xmlBytes));

        TransformerFactory transformerFactory = TransformerFactory
                .newInstance();
        Transformer transformer = transformerFactory.newTransformer();
        DOMSource source = new DOMSource(document);

        FileOutputStream output = new FileOutputStream(PathConstant.INVOKER + ocFileName);
        StreamResult result = new StreamResult(output);
        transformer.transform(source, result);

        // calculate updated invoker files content hmac
        Path updatedInvokerFile = Paths.get(PathConstant.INVOKER + ocFileName);
        byte[] updatedXmlBytes = Files.readAllBytes(updatedInvokerFile);

        return HmacUtility.encode(updatedXmlBytes);
    }
}

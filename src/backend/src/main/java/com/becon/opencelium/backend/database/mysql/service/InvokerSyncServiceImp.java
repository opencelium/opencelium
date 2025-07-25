package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.database.mysql.entity.InvokerSync;
import com.becon.opencelium.backend.database.mysql.repository.InvokerSyncRepository;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.subscription.remoteapi.RemoteApi;
import com.becon.opencelium.backend.subscription.remoteapi.RemoteApiFactory;
import com.becon.opencelium.backend.subscription.remoteapi.enums.ApiModule;
import com.becon.opencelium.backend.subscription.remoteapi.enums.ApiType;
import com.becon.opencelium.backend.subscription.remoteapi.module.InvokerModule;
import com.becon.opencelium.backend.utility.crypto.HmacUtility;
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
    private final RemoteApi remoteApi;
    private final InvokerService invokerService;
    private final InvokerSyncRepository invokerSyncRepository;

    @Value("${opencelium.online_services.invoker_sync.active:false}")
    private boolean active;
    private static final Path INVOKER_FILES_PATH = Paths.get(PathConstant.INVOKER);

    public InvokerSyncServiceImp(InvokerService invokerService, InvokerSyncRepository invokerSyncRepository) {
        this.invokerService = invokerService;
        this.invokerSyncRepository = invokerSyncRepository;
        this.remoteApi = RemoteApiFactory.createInstance(ApiType.SERVICE_PORTAL);
    }

    @Override
    public void update(String invokerName) {
        File invokerFile = invokerService.findFileByInvokerName(invokerName);

        Path filepath = invokerFile.toPath();
        try {
            byte[] xmlBytes = Files.readAllBytes(filepath);

            String ocFileName = filepath.getFileName().toString(); // default value until invoker file is not loaded from service portal
            String contentHmac = HmacUtility.encode(xmlBytes);

            InvokerSync sync = new InvokerSync();
            Optional<InvokerSync> optionalSync = findByInvokerName(invokerName);
            if (optionalSync.isPresent()) {
                sync = optionalSync.get();

                sync.setInvokerContentHmac(contentHmac);
                sync.setManuallyModified(false);
            } else {
                sync.setInvokerName(invokerName);
                sync.setSpInvokerFileName(ocFileName);
                sync.setInvokerContentHmac(contentHmac);
                sync.setManuallyModified(false);
            }

            save(sync);
        } catch (Exception e) {
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
        InvokerSync sync = findByInvokerName(invokerName)
                .orElseThrow(() -> new RuntimeException("Invoker with name = '" + invokerName + "' not found."));

        // load invoker file by its 'service portal filename' from service portal
        InvokerModule invokerModule = (InvokerModule) remoteApi.getModule(ApiModule.INVOKER);
        byte[] xmlBytes = invokerModule.getInvokerFileByName(sync.getSpInvokerFileName()).getBody();
        Objects.requireNonNull(xmlBytes);

        try {
            // extract required fields
            String contentHmac = HmacUtility.encode(xmlBytes);

            boolean isContentSame = Objects.equals(contentHmac, sync.getInvokerContentHmac());
            if (!isContentSame) {
                // only replace/copy invoker file in case of a different content
                saveOrUpdateInvokerFile(xmlBytes, invokerName);

                sync.setInvokerContentHmac(contentHmac);
            }
            sync.setManuallyModified(false);

            save(sync);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }


    // SYSTEM LEVEL METHODS
    @EventListener(ApplicationReadyEvent.class)
    void init() {
        // populate invoker_sync table to have date on current invokers in oc
        calculateHmacs();
    }

    @Transactional
    @Scheduled(cron = "${opencelium.online_services.invoker_sync.time}")
    void syncInvokers() {
        if (!active) {
            return;
        }

        // recalculate each files hmac to detect any manual changes
        calculateHmacs();

        // load invoker files as zip from service portal
        InvokerModule invokerModule = (InvokerModule) remoteApi.getModule(ApiModule.INVOKER);
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
                    String spFilename = entry.getName();
                    String contentHmac = HmacUtility.encode(xmlBytes);

                    InvokerSync sync = new InvokerSync();
                    if (invokerService.existsByName(invokerName)) {
                        // update existing invoker file if not been changed manually
                        Optional<InvokerSync> optionalSync = findByInvokerName(invokerName);
                        if (optionalSync.isPresent()) {
                            sync = optionalSync.get();

                            boolean isContentSame = Objects.equals(contentHmac, sync.getInvokerContentHmac());
                            if (!sync.isManuallyModified() && !isContentSame) {
                                // invoker file is not been modified manually &&
                                // we have different (file content is different) from ServicePortal
                                saveOrUpdateInvokerFile(xmlBytes, invokerName);

                                // update hmac to new files' contents' hmac
                                sync.setInvokerContentHmac(contentHmac);
                            }
                        } else {
                            saveOrUpdateInvokerFile(xmlBytes, invokerName);

                            // invoker file exists, but we do not have a sync record so just store it
                            sync.setInvokerName(invokerName);
                            sync.setInvokerContentHmac(contentHmac);
                            sync.setManuallyModified(false);
                        }
                    } else {
                        saveOrUpdateInvokerFile(xmlBytes, invokerName);

                        // invoker file does not exist, save new file and its sync data
                        sync.setInvokerName(invokerName);
                        sync.setInvokerContentHmac(contentHmac);
                        sync.setManuallyModified(false);
                    }
                    sync.setSpInvokerFileName(spFilename); // update default ocFilename to spFileName

                    save(sync);
                }
            }

            // update invoker container
            invokerService.refresh();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }


    // PRIVATE METHODS
    private void save(InvokerSync sync) {
        invokerSyncRepository.save(sync);
    }

    private Optional<InvokerSync> findByInvokerName(String invokerName) {
        return invokerSyncRepository.findByInvokerName(invokerName);
    }

    private void calculateHmacs() {
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(INVOKER_FILES_PATH, "*.xml")) {
            for (Path entry : stream) {
                byte[] xmlBytes = Files.readAllBytes(entry);

                String invokerName = extractInvokerName(xmlBytes);
                String ocFileName = entry.getFileName().toString(); // default value until invoker file is not loaded from service portal
                String contentHmac = HmacUtility.encode(xmlBytes);

                InvokerSync sync = new InvokerSync();
                Optional<InvokerSync> optionalSync = findByInvokerName(invokerName);
                if (optionalSync.isPresent()) {
                    sync = optionalSync.get();

                    // we only store if file content is changed manually
                    // new hmac is stored only if invoker files' changes are synced manually
                    boolean isContentChanged = !Objects.equals(contentHmac, sync.getInvokerContentHmac());
                    sync.setManuallyModified(isContentChanged);
                } else {
                    sync.setInvokerName(invokerName);
                    sync.setSpInvokerFileName(ocFileName);
                    sync.setInvokerContentHmac(contentHmac);
                    sync.setManuallyModified(false);
                }

                save(sync);
            }
        } catch (Exception e) {
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

    private void saveOrUpdateInvokerFile(byte[] xmlBytes, String invokerName) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(false);
        DocumentBuilder builder = factory.newDocumentBuilder();
        Document document = builder.parse(new ByteArrayInputStream(xmlBytes));

        TransformerFactory transformerFactory = TransformerFactory
                .newInstance();
        Transformer transformer = transformerFactory.newTransformer();
        DOMSource source = new DOMSource(document);

        File invokerFile = invokerService.findFileByInvokerName(invokerName);
        String ocInvokerFilename = invokerFile.getName();

        FileOutputStream output = new FileOutputStream(PathConstant.INVOKER + ocInvokerFilename);
        StreamResult result = new StreamResult(output);
        transformer.transform(source, result);
    }
}

package com.becon.opencelium.backend.subscription.remoteapi;

import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.database.mysql.entity.InvokerSync;
import com.becon.opencelium.backend.database.mysql.service.InvokerSyncService;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.subscription.remoteapi.enums.ApiModule;
import com.becon.opencelium.backend.subscription.remoteapi.enums.ApiType;
import com.becon.opencelium.backend.subscription.remoteapi.module.InvokerModule;
import com.becon.opencelium.backend.utility.crypto.HmacUtility;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
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
import java.io.FileOutputStream;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Objects;
import java.util.Optional;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Component
public class InvokerSyncScheduler {
    private final RemoteApi remoteApi;
    private final InvokerSyncService invokerSyncService;
    private final InvokerService invokerService;

    @Value("${opencelium.online_services.invoker_sync.active:false}")
    private boolean active;
    private static final Path INVOKER_FILES_PATH = Paths.get(PathConstant.INVOKER);

    public InvokerSyncScheduler(InvokerSyncService invokerSyncService, InvokerService invokerService) {
        this.invokerSyncService = invokerSyncService;
        this.invokerService = invokerService;
        this.remoteApi = RemoteApiFactory.createInstance(ApiType.SERVICE_PORTAL);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void init() {
        // calculate each files hmac to detect any manual changes on app startup
        calculateHmacs();
    }

    @Scheduled(cron = "${opencelium.online_services.invoker_sync.time}")
    public void syncInvokers() {
        if (!active) {
            return;
        }

        // calculate each files hmac to detect any manual changes
        calculateHmacs();

        // update files that has no manual change
        InvokerModule invokerModule = (InvokerModule) remoteApi.getModule(ApiModule.INVOKER);

        byte[] zipBytes = invokerModule.getAllInvokerFiles().getBody();
        Objects.requireNonNull(zipBytes);
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

                    String name = extractName(xmlBytes);
                    String hmac = HmacUtility.encode(xmlBytes);

                    InvokerSync sync = new InvokerSync();
                    if (invokerService.existsByName(name)) {
                        // update existing invoker file if not changes manually
                        Optional<InvokerSync> optionalSync = invokerSyncService.findByInvokerName(name);
                        if (optionalSync.isPresent()) {
                            sync = optionalSync.get();

                            boolean isHmacSame = Objects.equals(hmac, sync.getInvokerContentHmac());
                            if (!sync.isHasManualSync() && !isHmacSame) {
                                // invoker file is not modified manually && we have new file from ServicePortal
                                saveOrUpdateInvokerFile(xmlBytes, name);

                                // update hmac to new file
                                sync.setInvokerContentHmac(hmac);
                            }
                        } else {
                            saveOrUpdateInvokerFile(xmlBytes, name);

                            // invoker file exists, but we do not have a sync record so just store it
                            sync.setInvokerName(name);
                            sync.setInvokerContentHmac(hmac);
                            sync.setHasManualSync(false);
                        }
                    } else {
                        saveOrUpdateInvokerFile(xmlBytes, name);

                        // save new files sync data
                        sync.setInvokerName(name);
                        sync.setInvokerContentHmac(hmac);
                        sync.setHasManualSync(false);
                    }
                    invokerSyncService.save(sync);
                }
            }

            // update invoker container
            invokerService.refresh();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }


    private void calculateHmacs() {
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(INVOKER_FILES_PATH, "*.xml")) {
            for (Path entry : stream) {
                byte[] xmlBytes = Files.readAllBytes(entry);

                String name = extractName(xmlBytes);
                String hmac = HmacUtility.encode(xmlBytes);

                InvokerSync sync = new InvokerSync();
                Optional<InvokerSync> optionalSync = invokerSyncService.findByInvokerName(name);
                if (optionalSync.isPresent()) {
                    sync = optionalSync.get();

                    // we only store if file content is changed manually
                    // new hmac is stored only if invoker files changes are synced manually
                    boolean isHmacChanged = !Objects.equals(hmac, sync.getInvokerContentHmac());
                    sync.setHasManualSync(isHmacChanged);
                } else {
                    sync.setInvokerName(name);
                    sync.setInvokerContentHmac(hmac);
                    sync.setHasManualSync(false);
                }

                invokerSyncService.save(sync);
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public static String extractName(byte[] xmlBytes) throws Exception {
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

    private void saveOrUpdateInvokerFile(byte[] xmlBytes, String name) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(false);
        DocumentBuilder builder = factory.newDocumentBuilder();
        Document document = builder.parse(new ByteArrayInputStream(xmlBytes));

        TransformerFactory transformerFactory = TransformerFactory
                .newInstance();
        Transformer transformer = transformerFactory.newTransformer();
        DOMSource source = new DOMSource(document);

        String f = PathConstant.INVOKER + name + ".xml";
        FileOutputStream output = new FileOutputStream(f);
        StreamResult result = new StreamResult(output);
        transformer.transform(source, result);
    }
}

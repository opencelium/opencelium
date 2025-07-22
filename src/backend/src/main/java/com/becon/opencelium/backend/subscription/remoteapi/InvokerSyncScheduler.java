package com.becon.opencelium.backend.subscription.remoteapi;

import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.database.mysql.entity.InvokerSync;
import com.becon.opencelium.backend.database.mysql.service.InvokerSyncService;
import com.becon.opencelium.backend.subscription.remoteapi.enums.ApiModule;
import com.becon.opencelium.backend.subscription.remoteapi.enums.ApiType;
import com.becon.opencelium.backend.subscription.remoteapi.module.InvokerModule;
import com.becon.opencelium.backend.utility.crypto.HmacUtility;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Component
public class InvokerSyncScheduler {
    private final RemoteApi remoteApi;
    private final InvokerSyncService invokerSyncService;
    @Value("${opencelium.online_services.invoker_sync.active:false}")
    private boolean active;
    private static final Path INVOKER_FILES_PATH = Paths.get(PathConstant.INVOKER);

    public InvokerSyncScheduler(InvokerSyncService invokerSyncService) {
        this.remoteApi = RemoteApiFactory.createInstance(ApiType.SERVICE_PORTAL);
        this.invokerSyncService = invokerSyncService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void precalculateHmacs() throws IOException {
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(INVOKER_FILES_PATH, "*.xml")) {
            for (Path entry : stream) {
                byte[] fileBytes = Files.readAllBytes(entry);
                String name = entry.toFile().getName();
                String hmac = HmacUtility.encode(fileBytes);

                InvokerSync sync = new InvokerSync();

                sync.setInvokerName(name);
                sync.setInvokerContentHmac(hmac);
                sync.setHasManualSync(false);

                Optional<InvokerSync> invokerSync = invokerSyncService.findByInvokerName(name);

                if (invokerSync.isPresent()) {
                    invokerSyncService.update(invokerSync.get().getId(), sync);
                } else {
                    invokerSyncService.save(sync);
                }
            }
        }
    }

    @Scheduled(cron = "${opencelium.online_services.invoker_sync.time}")
    public void syncInvokers() {
        if (!active) {
            System.out.println(active);
            return;
        }

        InvokerModule invokerModule = (InvokerModule) remoteApi.getModule(ApiModule.INVOKER);

        byte[] zipBytes = invokerModule.getAllInvokerFiles().getBody();

        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (entry.getName().endsWith(".xml")) {
                    byte[] xmlBytes = zis.readAllBytes();
                    String hmac = HmacUtility.encode(xmlBytes);
                }
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}

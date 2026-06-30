package com.becon.opencelium.backend.utility;

import org.apache.tomcat.util.http.fileupload.FileUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.nio.file.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public class ZipUtils {

    private static final Logger log = LoggerFactory.getLogger(ZipUtils.class);

    public static void extractZip(InputStream zipInputStream, Path rootPath) throws IOException {
        // Removes frontend file totally and then replaces from zip file.
        File f = new File("../frontend");
        FileUtils.deleteDirectory(f);
        try (ZipInputStream zis = new ZipInputStream(new BufferedInputStream(zipInputStream))) {
            ZipEntry zipEntry;

            while ((zipEntry = zis.getNextEntry()) != null) {
                // Use only the file name, discarding any leading directories
                String entryName = zipEntry.getName();
                Path targetPath = rootPath.resolve(entryName).normalize();
                //skip license creation/modification during update process. License folder must be created during installation.
                if (entryName.contains("src/backend/src/main/resources/license")){
                    continue;
                }
                // Ensure the entry does not escape the target directory
                if (!targetPath.startsWith(rootPath)) {
                    throw new IOException("Entry is outside of the target dir: " + zipEntry.getName());
                }

                if (zipEntry.isDirectory()) {
                    Files.createDirectories(targetPath);
                } else {
                    Files.createDirectories(targetPath.getParent()); // Ensure parent directories exist
                    String parent = targetPath.getParent().getFileName().toString();
                    String file = targetPath.getFileName().toString();
                    // we have to escape to remove files in conf folder except opencelium.service
                    // Talked with Bettina, she requested to change all files in conf folder.
//                    if (!parent.equals("conf") || file.equals("opencelium.service")) {
                    Files.copy(zis, targetPath, StandardCopyOption.REPLACE_EXISTING);
                    log.info("\"" + targetPath.normalize() + "\" has been replaced or added successfully");
//                    }
                }
            }
        }
    }

    public static void saveZip(InputStream inputStream, String zipFileName, Path dir) throws IOException {

        Path zipFilePath = dir.resolve(zipFileName + ".zip").normalize();

        // Ensure the target directory exists
        if (!Files.exists(dir)) {
            Files.createDirectory(dir);
        }
        Files.copy(inputStream, zipFilePath,
                StandardCopyOption.REPLACE_EXISTING);
    }
}

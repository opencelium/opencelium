package com.becon.opencelium.backend.utility;

import com.becon.opencelium.backend.application.assistant.AssistantServiceImp;
import org.apache.tomcat.util.http.fileupload.FileUtils;
import org.eclipse.jgit.util.IO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public class ZipUtils {

    private static final Logger log = LoggerFactory.getLogger(ZipUtils.class);

    public static void extractZip(InputStream zipInputStream, Path rootPath) throws IOException {
        // Removes frontend file totally and then replaces from zip file.
        File f = new File("../frontend");
        FileUtils.deleteDirectory(f);
        try (ZipInputStream zis = new ZipInputStream(new BufferedInputStream(zipInputStream))) {
            ZipEntry zipEntry = zis.getNextEntry();

            while (zipEntry != null) {
                // Use only the file name, discarding any leading directories
                String entryName = zipEntry.getName();
                Path targetPath = rootPath.resolve(entryName).normalize();

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
                    if (!parent.equals("conf") || file.equals("opencelium.service")) {
                        Files.copy(zis, targetPath, StandardCopyOption.REPLACE_EXISTING);
                        log.info("\"" + targetPath.normalize() + "\" has been replaced or added successfully");
                    }
                }
                zipEntry = zis.getNextEntry();
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

    private static void clearFolder(Path folder) throws IOException {
        if (Files.exists(folder)) {
            Files.walkFileTree(folder, new SimpleFileVisitor<Path>() {
                @Override
                public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                    Files.delete(file);
                    return FileVisitResult.CONTINUE;
                }

                @Override
                public FileVisitResult postVisitDirectory(Path dir, IOException exc) throws IOException {
                    if (!dir.equals(folder)) {
                        Files.delete(dir);
                    }
                    return FileVisitResult.CONTINUE;
                }
            });
        }
    }
}

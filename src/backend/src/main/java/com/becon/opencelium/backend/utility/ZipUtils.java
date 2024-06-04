package com.becon.opencelium.backend.utility;

import org.apache.tomcat.util.http.fileupload.FileUtils;
import org.eclipse.jgit.util.IO;

import java.io.*;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public class ZipUtils {

    public static void extractZip(InputStream zipInputStream, Path rootPath) throws IOException {
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
                    Files.copy(zis, targetPath, StandardCopyOption.REPLACE_EXISTING);
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

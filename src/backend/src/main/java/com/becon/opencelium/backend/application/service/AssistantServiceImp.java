package com.becon.opencelium.backend.application.service;

import com.becon.opencelium.backend.application.entity.SystemOverview;
import com.becon.opencelium.backend.application.repository.SystemOverviewRepository;
import com.becon.opencelium.backend.exception.StorageException;
import com.becon.opencelium.backend.resource.application.SystemOverviewResource;
import com.becon.opencelium.backend.template.entity.Template;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;


@Service
public class AssistantServiceImp implements ApplicationService {

    @Autowired
    private SystemOverviewRepository systemOverviewRepository;

    @Override
    public SystemOverview getSystemOverview() {
        return systemOverviewRepository.getCurrentOverview();
    }

    @Override
    public void uploadZipFile(MultipartFile file, String location) {
        String filename = file.getOriginalFilename();
        Path source = Paths.get(location);
        try {
            if (file.isEmpty()) {
                throw new StorageException("Failed to store empty file " + filename);
            }
            if (filename.contains("..")) {
                // This is a security check
                throw new StorageException(
                        "Cannot store file with relative path outside current directory "
                                + filename);
            }
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, source.resolve(filename),
                        StandardCopyOption.REPLACE_EXISTING);
            }
        }
        catch (IOException e) {
            e.printStackTrace();
            throw new StorageException("Failed to store file " + filename, e);
        }
    }

    @Override
    public void deleteZipFile(Path path) {
        if(path.equals("")){
            return;
        }
        try {
            File tempFile = new File(path.toString());
            if(tempFile.exists()){
                Files.delete(path);
            }
        }
        catch (IOException e){
            throw new StorageException("Failed to delete stored file", e);
        }
    }

    @Override
    public SystemOverviewResource toResource(SystemOverview systemOverview) {
        SystemOverviewResource systemOverviewResource = new SystemOverviewResource();
        systemOverviewResource.setJava(systemOverview.getJava());
        systemOverviewResource.setOc(systemOverview.getOs());
        systemOverviewResource.setElasticSearch(systemOverview.getElasticSearch());
        systemOverviewResource.setKibana(systemOverview.getKibana());
        systemOverviewResource.setMariadb(systemOverview.getMariadb());
        systemOverviewResource.setNeo4j(systemOverview.getNeo4j());
        return systemOverviewResource;
    }


    private void unzipFolder(Path source, Path target) throws IOException {

        try (ZipInputStream zis = new ZipInputStream(new FileInputStream(source.toFile()))) {
            ZipEntry zipEntry = zis.getNextEntry();

            while (zipEntry != null) {

                boolean isDirectory = false;
                if (zipEntry.getName().endsWith(File.separator)) {
                    isDirectory = true;
                }

                Path newPath = zipSlipProtect(zipEntry, target);

                if (isDirectory) {
                    Files.createDirectories(newPath);
                } else {

                    // example 1.2
                    // some zip stored file path only, need create parent directories
                    // e.g data/folder/file.txt
                    if (newPath.getParent() != null) {
                        if (Files.notExists(newPath.getParent())) {
                            Files.createDirectories(newPath.getParent());
                        }
                    }
                    Files.copy(zis, newPath, StandardCopyOption.REPLACE_EXISTING);
                }

                zipEntry = zis.getNextEntry();

            }
            zis.closeEntry();

        }

    }

    private Path zipSlipProtect(ZipEntry zipEntry, Path targetDir)
            throws IOException {
        Path targetDirResolved = targetDir.resolve(zipEntry.getName());
        Path normalizePath = targetDirResolved.normalize();
        if (!normalizePath.startsWith(targetDir)) {
            throw new IOException("Bad zip entry: " + zipEntry.getName());
        }

        return normalizePath;
    }
}

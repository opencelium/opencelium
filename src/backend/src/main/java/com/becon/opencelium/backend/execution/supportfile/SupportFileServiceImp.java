package com.becon.opencelium.backend.execution.supportfile;

import com.becon.opencelium.backend.constant.props.SupportFileProperties;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.service.ConnectionService;
import com.becon.opencelium.backend.enums.SupportFileStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

import static com.becon.opencelium.backend.utility.LogFileUtility.delete;
import static com.becon.opencelium.backend.utility.LogFileUtility.toPath;

@Service
public class SupportFileServiceImp implements SupportFileService {
    private final ConnectionService connectionSqlService;
    private final String base;

    public static final String GET_URL = "/connection/support-file/%d/%s";

    public SupportFileServiceImp(ConnectionService connectionSqlService, SupportFileProperties supportFileProperties) {
        this.connectionSqlService = connectionSqlService;
        this.base = supportFileProperties.getDirectory();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SupportFile> supportFileList() {
        Path path = toPath(base);

        List<SupportFile> result = new ArrayList<>();

        try (Stream<Path> files = Files.list(path)) {
            files.forEach(file -> {
                String fileName = file.getFileName().toString();

                if (Files.isDirectory(file) && fileName.matches("\\d+")) {
                    Long connectionId = Long.parseLong(fileName);
                    List<String> urls = getZipUrls(connectionId, file);

                    String connectionTitle;
                    SupportFileStatus status;
                    String message;

                    if (connectionSqlService.existsById(connectionId)) {
                        Connection connection = connectionSqlService.getById(connectionId);

                        connectionTitle = connection.getTitle();
                        status = SupportFileStatus.CONNECTION_FOUND;
                        message = "Connection is found.";
                    } else {
                        connectionTitle = null;
                        status = SupportFileStatus.CONNECTION_IS_MISSING;
                        message = "Connection not found.";
                    }

                    urls.forEach(url -> result.add(new SupportFile(connectionId, connectionTitle, url, status, message)));
                }
            });
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        return result;
    }

    @Override
    public List<SupportFile> connectionSupportFileList(Long connectionId) {
        Path path = toPath(base, connectionId.toString());

        List<SupportFile> result = new ArrayList<>();

        if (Files.isDirectory(path)) {
            List<String> urls = getZipUrls(connectionId, path);

            String connectionTitle;
            SupportFileStatus status;
            String message;

            if (connectionSqlService.existsById(connectionId)) {
                Connection connection = connectionSqlService.getById(connectionId);

                connectionTitle = connection.getTitle();
                status = SupportFileStatus.CONNECTION_FOUND;
                message = "Connection is found.";
            } else {
                connectionTitle = null;
                status = SupportFileStatus.CONNECTION_IS_MISSING;
                message = "Connection not found.";
            }

            urls.forEach(url -> result.add(new SupportFile(connectionId, connectionTitle, url, status, message)));
        }

        return result;
    }

    @Override
    public File getSupportFile(Long connectionId, String zipFileName) {
        // check whether file exists for this connection
        Path path = toPath(base, connectionId.toString(), zipFileName);

        if (Files.isRegularFile(path)) {
            return path.toFile();
        } else {
            throw new RuntimeException("Support file with name ='" + zipFileName + "' not found");
        }
    }

    @Override
    public File getSupportFile(Long connectionId) {
        // try to find successful execution support file by pattern
        String filePattern = "*_" + connectionId + "_s_*.zip";

        try (DirectoryStream<Path> stream = Files.newDirectoryStream(toPath(base, connectionId.toString()), filePattern)) {
            for (Path path : stream) {
                return path.toFile();
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        throw new RuntimeException("Support file for successful execution not found for connectionId = " + connectionId);
    }

    @Override
    public void deleteSupportFile(String zipFilename) {
        String dateRemoved = zipFilename.substring(17);
        String connectionId = dateRemoved.substring(0, dateRemoved.indexOf('_'));
        Path zipPath = toPath(base, connectionId, zipFilename);

        try {
            delete(zipPath);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }


    private List<String> getZipUrls(Long connectionId, Path directory) {
        List<String> names = new ArrayList<>();

        try (DirectoryStream<Path> zips = Files.newDirectoryStream(directory, "*.zip")) {
            zips.forEach(zip -> {
                if (Files.isRegularFile(zip)) {
                    names.add(String.format(GET_URL, connectionId, zip.getFileName().toString()));
                }
            });

            return names;
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}

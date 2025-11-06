package com.becon.opencelium.backend.versionmanager.backup.mysql;

import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.constant.props.OpenceliumProps;
import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import com.becon.opencelium.backend.database.mysql.service.EnhancementService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Stream;

@Primary
@Component
public class MysqlCSVBackupService implements MysqlBackupService {

    private static final Path rootPath = Paths.get(PathConstant.BACKUP);
    private static final Logger log = LoggerFactory.getLogger(MysqlCSVBackupService.class);
    private final OpenceliumProps ocProps;
    private final EnhancementService enhancementService;

    public MysqlCSVBackupService(OpenceliumProps ocProps, EnhancementService enhancementService) {
        this.ocProps = ocProps;
        this.enhancementService = enhancementService;
    }

    @Override
    public void backup(String tableName) {
        if (isBackupExists(tableName)) {
            log.info("Skipped taking backup. Because backup file already exists for table {}", tableName);

            return;
        }

        List<Enhancement> enhancements = enhancementService.getAll();

        String csv = toCSV(
                enhancements,
                x -> String.valueOf(x.getId()),
                Enhancement::getTitle,
                Enhancement::getDescription,
                Enhancement::getScript,
                Enhancement::getArgs,
                Enhancement::getSimpleCode,
                x -> String.valueOf(x.getConnection().getId())
        );

        writeToFIle(rootPath.resolve(tableName).resolve(buildFilePath(tableName)), csv);
    }

    private boolean isBackupExists(String tableName) {
        if (Files.exists(rootPath) && Files.exists(rootPath.resolve(tableName))) {
            String fileNameRegex = tableName + "_backup_v" + ocProps.getVersion().replace('.', '_') + "_.{10}\\.csv";

            try (Stream<Path> stream = Files.walk(rootPath.resolve(tableName))) {
                return stream.anyMatch(x -> x.getFileName().toString().matches(fileNameRegex));
            } catch (IOException e) {
                return false;
            }
        }
        return false;
    }

    @Override
    public MysqlBackupType getType() {
        return MysqlBackupType.CSV;
    }

    private void writeToFIle(Path filePath, String content) {
        try {
            if (!Files.exists(filePath)) {
                filePath.toFile().createNewFile();
            }
            Files.write(filePath, content.getBytes(), StandardOpenOption.TRUNCATE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed to write a file during backup : " + e.getMessage(), e);
        }
    }

    private String buildFilePath(String entityName) {
        return entityName +
                "_backup_v" +
                ocProps.getVersion().replace('.', '_') + "_" +
                LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy_MM_dd")) +
                ".csv";
    }

    @SafeVarargs
    private <T> void appendRowToCSV(T data, StringBuilder sb, Function<T, String>... functions) {
        for (int i = 0; i < functions.length; i++) {

            sb.append("\"")
                    .append(functions[i].apply(data))
                    .append("\"");

            if (i != functions.length - 1) {
                sb.append(",");
            }
        }
    }

    @SafeVarargs
    private <T> String toCSV(List<T> data, Function<T, String>... functions) {
        StringBuilder sb = new StringBuilder();
        for (T row : data) {
            appendRowToCSV(row, sb, functions);
            sb.append('\n');
        }
        return sb.toString();
    }
}

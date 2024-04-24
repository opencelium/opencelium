package com.becon.opencelium.backend.utility.migrate;

import com.becon.opencelium.backend.utility.patch.PatchHelper;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLGenerator;
import com.fasterxml.jackson.dataformat.yaml.YAMLMapper;
import com.github.fge.jsonpatch.JsonPatch;
import org.springframework.jdbc.BadSqlGrammarException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.util.FileCopyUtils;

import java.io.*;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

public class YAMLMigrator {
    private static final JdbcTemplate JDBC_TEMPLATE;
    private static final ChangeSetDao DAO;
    private static final Logger LOGGER = Logger.getLogger(YAMLMigrator.class.getName());
    private static final YAMLMapper YAML_MAPPER = new YAMLMapper();
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final PatchHelper PATCH_HELPER;
    private static final File CHANGELOG_FILE;
    private static final File APP_YML_COMPILED_FILE;
    private static final File APP_YML_FILE;
    private static final File BACKUP_YML_FILE;

    private static List<ChangeSet> changeSetsToSave;

    static {
        YAML_MAPPER.enable(YAMLGenerator.Feature.MINIMIZE_QUOTES);
        YAML_MAPPER.enable(JsonParser.Feature.ALLOW_YAML_COMMENTS);
        YAML_MAPPER.disable(YAMLGenerator.Feature.SPLIT_LINES);
        YAML_MAPPER.disable(YAMLGenerator.Feature.WRITE_DOC_START_MARKER);

        JDBC_TEMPLATE = new JdbcTemplate();
        DAO = new ChangeSetDao(JDBC_TEMPLATE);
        PATCH_HELPER = new PatchHelper(OBJECT_MAPPER);
        Path root = Paths.get(new File("").toURI());
        APP_YML_FILE = new File(root.resolve("src/main/resources/application.yml").toString());
        APP_YML_COMPILED_FILE = new File(root.resolve("build/resources/main/application.yml").toString());
        CHANGELOG_FILE = new File(root.resolve("build/resources/main/db/changelog/springboot/application_changelog.yml").toString());
        BACKUP_YML_FILE = new File(root.resolve("build/resources/main/application_copy.yml").toString());
    }

    public static void run() {
        // checking an existence of changelog file
        if (!CHANGELOG_FILE.exists()) {
            return;
        }

        // checking an existence of application.yml file
        if (!APP_YML_FILE.exists()) {
            LOGGER.warning("A file 'application.yml' does not exist");
            return;
        }

        //preparing a file before read
        if (!prepare()) return;

        //parse application.yml file
        Map<String, Object> appYamlMap = readYAMLFile(APP_YML_FILE);
        if (appYamlMap == null) return;

        // read datasource's configs from yaml file and set datasource to jdbcTemplate
        if (!setDataSource(appYamlMap)) return;

        Map<String, Object> changelog = readYAMLFile(CHANGELOG_FILE);
        if (changelog == null || changelog.isEmpty()) return;

        ChangeSet lastSavedSet = getLastChangeSet();
        String fullVersionOfLastChangeSetInFile = getLastChangeSetVersionToApply(changelog);

        // there is not any new changes
        if (fullVersionOfLastChangeSetInFile == null || lastSavedSet != null && isGreaterThanOrEqual(lastSavedSet.getVersion(), fullVersionOfLastChangeSetInFile)) {
            return;
        }

        List<ChangeSet> changeSetList = validateAndConvert((ArrayList<Map<String, Object>>) changelog.get("versions"));

        List<ChangeSet> newChangeSets = new ArrayList<>();
        for (ChangeSet changeSet : changeSetList) {
            if (lastSavedSet == null || !isGreaterThanOrEqual(lastSavedSet.getVersion(), changeSet.getVersion())) {
                newChangeSets.add(changeSet);
            }
        }
        if (newChangeSets.isEmpty()) return;

        Object patched = appYamlMap;
        for (int i = 0; i < newChangeSets.size(); i++) {
            ChangeSet changeSet = newChangeSets.get(i);
            JsonPatch singleJsonPatch = convertToJsonPatch(changeSet);
            if (singleJsonPatch == null) {
                changeSet.setSuccess(false);
                continue;
            }
            try {
                patched = PATCH_HELPER.patch(singleJsonPatch, patched, Object.class);
                changeSet.setSuccess(true);
            } catch (RuntimeException e) {
                if (e.getCause().getMessage().equals("parent of node to add does not exist")) {
                    patched = fillUp(changeSet.getPath().replaceAll("\\.", "/"), singleJsonPatch, patched);
                    i--;
                } else if (e.getCause().getMessage().equals("value cannot be null")) {
                    changeSet.setSuccess(false);
                } else {
                    LOGGER.warning("An error occurred while applying " + changeSet.getVersion() + " - changeset : " + e.getCause().getMessage());
                    finish(patched, newChangeSets.subList(0, i));
                    return;
                }
            }
        }
        finish(patched, newChangeSets);
    }

    private static boolean prepare() {
//        try {
//            if (!BACKUP_YML_FILE.createNewFile()) {
//                return false;
//            }
//            FileCopyUtils.copy(APP_YML_FILE, BACKUP_YML_FILE);
//        } catch (IOException e) {
//            LOGGER.warning("An error occurred to copy application.yml file");
//            return false;
//        }
        StringBuilder sb;
        try (BufferedReader reader = new BufferedReader(new FileReader(APP_YML_FILE))) {
            String line;
            sb = new StringBuilder();
            while ((line = reader.readLine()) != null) {
                if (line.contains("{") && line.contains("}") && !isCommentLine(line)) {
                    String val = line.substring(line.indexOf(":") + 1).trim();
                    if (val.startsWith("{") && val.endsWith("}")) {
                        val = val.replaceFirst("\\{", "#").substring(0, val.length() - 1);
                        line = line.substring(0, line.indexOf(":") + 2) + val;
                    }
                }
                sb.append(line);
                sb.append("\n");
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        try (FileOutputStream fosCOM = new FileOutputStream(APP_YML_COMPILED_FILE)) {
            fosCOM.write(sb.toString().getBytes());
        } catch (IOException e) {
//            try {
//                FileCopyUtils.copy(BACKUP_YML_FILE, APP_YML_COMPILED_FILE);
//            } catch (IOException ignored) {
//            }
            return false;
        }

        try (FileOutputStream fos = new FileOutputStream(APP_YML_FILE)) {
            fos.write(sb.toString().getBytes());
        } catch (IOException e) {
//            try {
//                FileCopyUtils.copy(BACKUP_YML_FILE, APP_YML_FILE);
//            } catch (IOException ignored) {
//            }
            return false;
        }
        return true;
    }

    private static boolean isCommentLine(String line) {
        return line.trim().startsWith("#");
    }

    private static void finish(Object yaml, List<ChangeSet> changeSetsForSave) {
        if (changeSetsForSave.isEmpty()) {
            return;
        }

        try {
            YAML_MAPPER.writeValue(APP_YML_FILE, yaml);
            YAML_MAPPER.writeValue(APP_YML_COMPILED_FILE, yaml);
        } catch (IOException e) {
            LOGGER.warning("Failed to write YAML file");
            return;
        }

        try {
            // checking an existence of table
            DAO.getLast();
        } catch (BadSqlGrammarException e) {
            YAMLMigrator.changeSetsToSave = changeSetsForSave;
            return;
        }
        DAO.createAll(changeSetsForSave);
    }

    private static Object fillUp(String path, final JsonPatch jsonPatch, Object obj) {
        JsonPatch parent = PATCH_HELPER.changeEachPath(jsonPatch, x -> x.substring(0, x.lastIndexOf("/")));
        parent = PATCH_HELPER.changeEachValue(parent, new HashMap<String, Object>());
        try {
            return PATCH_HELPER.patch(parent, obj, Object.class);
        } catch (RuntimeException e) {
            if (e.getMessage().equals("parent of node to add does not exist")) {
                return fillUp(path.substring(0, path.lastIndexOf("/")), parent, obj);
            }
            throw e;
        }
    }


    private static String getLastChangeSetVersionToApply(Map<String, Object> changelog) {
        var versions = (ArrayList<Map<String, Object>>) changelog.getOrDefault("versions", new ArrayList<Map<String, Object>>());
        if (versions.isEmpty()) {
            return null;
        }
        var lastVersion = versions.get(versions.size() - 1);
        try {
            Double version = (Double) lastVersion.get("version");
            var changes = (ArrayList<Map<String, Object>>) lastVersion.get("changes");
            Map<String, Object> lastChaneSet = changes.get(changes.size() - 1);
            var changeset = (Integer) lastChaneSet.get("changeset");
            return version + ":" + changeset;
        } catch (Exception e) {
            return "-1.0:0";
        }
    }

    private static JsonPatch convertToJsonPatch(ChangeSet changeSet) {
        ArrayList<Map<?, ?>> opList = new ArrayList<>();
        Map<String, Object> map = new HashMap<>();
        switch (changeSet.getOperation()) {
            case "add" -> {
                map.put("op", changeSet.getOperation());
                map.put("path", "/" + changeSet.getPath().replaceAll("\\.", "/"));
                map.put("value", changeSet.getValue());
            }
            case "modify" -> {
                map.put("op", "replace");
                map.put("path", "/" + changeSet.getPath().replaceAll("\\.", "/"));
                map.put("value", changeSet.getValue());
            }
            case "delete" -> {
                map.put("op", "remove");
                map.put("path", "/" + changeSet.getPath().replaceAll("\\.", "/"));
            }
            case "rename" -> {
                map.put("op", "move");
                map.put("from", "/" + changeSet.getPath().replaceAll("\\.", "/"));
                map.put("to", "/" + ((String) (changeSet.getValue())).replaceAll("\\.", "/"));
            }
            default -> {
                LOGGER.warning("Unsupported operation: " + changeSet.getOperation());
                return null;
            }
        }
        opList.add(map);
        return OBJECT_MAPPER.convertValue(opList, JsonPatch.class);
    }

    private static List<ChangeSet> validateAndConvert(ArrayList<Map<String, Object>> versions) {
        List<ChangeSet> res = new ArrayList<>();
        for (Map<String, Object> version : versions) {
            if (!version.containsKey("version") || !version.containsKey("changes")) {
                LOGGER.warning("Version does not contain 'version' and|or 'changes' field. All the rest changesets are ignored");
                return res;
            }
            Double versionVal;
            try {
                versionVal = (Double) version.get("version");
            } catch (Exception e) {
                LOGGER.warning(version.get("version") + " is not a number. All the rest changesets are ignored");
                return res;
            }
            try {
                List<Object> changes = (List<Object>) version.get("changes");
                if (changes == null || changes.isEmpty()) continue;
                for (Object change : changes) {
                    Map<String, Object> map = (Map<String, Object>) change;
                    ChangeSet changeSet = new ChangeSet();
                    changeSet.setPath((String) map.get("path"));
                    changeSet.setValue(map.get("value"));
                    changeSet.setOperation((String) map.get("operation"));
                    changeSet.setVersion(versionVal + ":" + map.get("changeset"));
                    res.add(changeSet);
                }
            } catch (Exception e) {
                LOGGER.warning("An error is occurred while reading changeset. All the rest changesets are ignored");
                return res;
            }
        }
        return res;
    }

    @SuppressWarnings("unchecked")
    private static boolean setDataSource(Map<String, Object> yaml) {
        Map<String, Object> spring = (Map<String, Object>) yaml.getOrDefault("spring", new HashMap<>());
        Map<String, Object> datasource = (Map<String, Object>) spring.getOrDefault("datasource", new HashMap<>());
        String url = datasource.getOrDefault("url", "").toString();
        String username = datasource.getOrDefault("username", "").toString();
        String password = datasource.getOrDefault("password", "").toString();
        String driver = datasource.getOrDefault("driver-class-name", "").toString();

        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setUrl(url);
        dataSource.setUsername(username);
        dataSource.setPassword(password);
        dataSource.setDriverClassName(driver);

        //checking connectivity
        try {
            dataSource.getConnection();
        } catch (SQLException e) {
            LOGGER.warning("An error is occurred while connecting to the database");
            return false;
        }
        JDBC_TEMPLATE.setDataSource(dataSource);
        return true;
    }

    private static boolean isGreaterThanOrEqual(String v1, String v2) {
        String[] split1 = v1.split(":");
        String[] split2 = v2.split(":");
        double ver1 = Double.parseDouble(split1[0]);
        double ver2 = Double.parseDouble(split2[0]);
        if (ver1 > ver2) {
            return true;
        } else if (ver1 == ver2) {
            return Integer.parseInt(split1[1]) >= Integer.parseInt(split2[1]);
        }
        return false;
    }

    private static Map<String, Object> readYAMLFile(File file) {
        try {
            return YAML_MAPPER.readValue(file, new TypeReference<>() {
            });
        } catch (IOException e) {
            LOGGER.warning("Failed to parse '" + file.getName() + "' file");
            return null;
        }
    }

    private static ChangeSet getLastChangeSet() {
        try {
            return DAO.getLast();
        } catch (BadSqlGrammarException e) {
            //Table has not been created yet
            return null;
        }
    }

    public static List<ChangeSet> getChangeSetsToSave() {
        List<ChangeSet> list = changeSetsToSave;
        changeSetsToSave = null;
        return list;
    }

    private static class Comment {
        List<String> lines = new ArrayList<>();
        String prev;
        String next;
    }
}

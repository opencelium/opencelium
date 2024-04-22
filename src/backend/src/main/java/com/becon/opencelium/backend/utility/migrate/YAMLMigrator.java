package com.becon.opencelium.backend.utility.migrate;

import com.becon.opencelium.backend.utility.patch.PatchHelper;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.dataformat.yaml.YAMLGenerator;
import com.fasterxml.jackson.dataformat.yaml.YAMLMapper;
import com.github.fge.jsonpatch.JsonPatch;
import org.springframework.jdbc.BadSqlGrammarException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import java.io.File;
import java.io.IOException;
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
    public static List<ChangeSet> changeSetsToSave;

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

        //parse application.yml file
        Map<String, Object> yaml = readYAMLFile(APP_YML_FILE);
        if (yaml == null) return;

        // read datasource's configs from yaml file and set datasource to jdbcTemplate
        setDataSource(yaml);

        Map<String, Object> changelog = readYAMLFile(CHANGELOG_FILE);
        if (changelog == null || changelog.isEmpty()) return;

        ChangeSet lastSavedSet = getLastChangeSet();
        String fullVersionOfLastChangeSetInFile = getLastChangeSetVersionToApply(changelog);

        // there is not any new changes
        if (fullVersionOfLastChangeSetInFile ==null || lastSavedSet != null && isGreaterThanOrEqual(lastSavedSet.getVersion(), fullVersionOfLastChangeSetInFile)) {
            return;
        }

        List<ChangeSet> changeSetList = validateAndMapConvert((ArrayList<Map<String, Object>>) changelog.get("versions"));

        List<ChangeSet> newChangeSets = new ArrayList<>();
        for (ChangeSet changeSet : changeSetList) {
            if (lastSavedSet == null || !isGreaterThanOrEqual(lastSavedSet.getVersion(), changeSet.getVersion())) {
                newChangeSets.add(changeSet);
            }
        }
        if (newChangeSets.isEmpty()) return;

        Object patched = yaml;
        for (int i = 0; i < newChangeSets.size(); i++) {
            ChangeSet changeSet = newChangeSets.get(i);
            JsonPatch singleJsonPatch = convertToJsonPatch(changeSet);
            if(singleJsonPatch == null){
                changeSet.setSuccess(false);
                continue;
            }
            try {
                patched = PATCH_HELPER.patch(singleJsonPatch, patched, Object.class);
                changeSet.setSuccess(true);
            } catch (RuntimeException e) {
                if (e.getCause().getMessage().equals("parent of node to add does not exist")) {
                    patched = fillUp(changeSet.getPath().replaceAll("\\.","/"), singleJsonPatch, patched);
                    i--;
                } else if (e.getCause().getMessage().equals("value cannot be null")) {
                    changeSet.setSuccess(false);
                } else {
                    LOGGER.warning("An error occurred while applying "+changeSet.getVersion()+" - changeset : " + e.getCause().getMessage());
                    finish(patched, newChangeSets.subList(0, i));
                    return;
                }
            }
        }
        finish(patched, newChangeSets);
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


    //TODO: must be refactored
    private static String getLastChangeSetVersionToApply(Map<String, Object> changelog) {
        ArrayList<Map<String, Object>> versions = (ArrayList<Map<String, Object>>) changelog.getOrDefault("versions", new ArrayList<>());
        if(versions == null || versions.isEmpty()){
            return null;
        }
        Map<String, Object> lastVersion = versions.get(versions.size() - 1);
        Double version = (Double) lastVersion.get("version");
        ArrayList<Map<String, Object>> changes = (ArrayList<Map<String, Object>>) lastVersion.getOrDefault("changes", new ArrayList<>());
        Map<String, Object> lastChaneSet = changes.get(changes.size() - 1);
        Integer changeset = (Integer) lastChaneSet.get("changeset");
        return version + ":" + changeset;
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

    private static List<ChangeSet> validateAndMapConvert(ArrayList<Map<String, Object>> versions) {
        List<ChangeSet> res = new ArrayList<>();
        for (Map<String, Object> version : versions) {
            if (!version.containsKey("version") || !version.containsKey("changes")) {
                LOGGER.warning("Version does not contain 'version' or 'changeset' field");
                return res;
            }
            Double versionVal;
            try {
                versionVal = (Double) version.get("version");
            } catch (Exception e) {
                LOGGER.warning(version.get("version") + " is not a number");
                return res;
            }
            try {
                List<Object> changes = (List<Object>) version.get("changes");
                if (changes == null || changes.isEmpty()) continue;
                for (Object change : changes) {
                    Map<String, Object> map = (Map<String, Object>) change;
                    ChangeSet changeSet = new ChangeSet();
                    changeSet.setPath((String) map.get("path"));
                    changeSet.setValue(map.getOrDefault("value", null));
                    changeSet.setOperation((String) map.get("operation"));
                    changeSet.setVersion(versionVal + ":" + map.get("changeset"));
                    res.add(changeSet);
                }
            } catch (Exception e) {
                LOGGER.warning("An error is occurred while reading changeset. So the next ones ignored");
                return res;
            }
        }
        return res;
    }

    @SuppressWarnings("unchecked")
    private static void setDataSource(Map<String, Object> yaml) {
        Map<String, Object> spring = (Map<String, Object>) yaml.get("spring");
        Map<String, Object> datasource = (Map<String, Object>) spring.get("datasource");
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
            throw new RuntimeException(e);
        }

        JDBC_TEMPLATE.setDataSource(dataSource);
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
}

package com.becon.opencelium.backend.utility.migrate;

import com.becon.opencelium.backend.utility.patch.PatchHelper;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLGenerator;
import com.fasterxml.jackson.dataformat.yaml.YAMLMapper;
import com.github.fge.jsonpatch.JsonPatch;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.BadSqlGrammarException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.util.FileCopyUtils;

import java.io.*;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.SQLException;
import java.util.*;

public class YAMLMigrator {
    private static final JdbcTemplate JDBC_TEMPLATE;
    private static final ChangeSetDao DAO;
    private static final YAMLMapper YAML_MAPPER = new YAMLMapper();
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final PatchHelper PATCH_HELPER;
    private static final File CHANGELOG_FILE;
    private static final File APP_YML_FILE;
    private static final File BACKUP_YML_FILE;
    private static final Logger log = LoggerFactory.getLogger(YAMLMigrator.class);

    private static List<ChangeSet> changeSetsToSave;

    static {
        //yamlMapper config
        YAML_MAPPER.enable(YAMLGenerator.Feature.MINIMIZE_QUOTES);
        YAML_MAPPER.enable(JsonParser.Feature.ALLOW_YAML_COMMENTS);
        YAML_MAPPER.disable(YAMLGenerator.Feature.SPLIT_LINES);
        YAML_MAPPER.disable(YAMLGenerator.Feature.WRITE_DOC_START_MARKER);

        JDBC_TEMPLATE = new JdbcTemplate();
        DAO = new ChangeSetDao(JDBC_TEMPLATE);

        PATCH_HELPER = new PatchHelper(OBJECT_MAPPER);

        Path root = Paths.get(new File("").toURI());
        APP_YML_FILE = new File(root.resolve("src/main/resources/application.yml").toString());
        CHANGELOG_FILE = new File(root.resolve("src/main/resources/db/changelog/springboot/application_changelog.yml").toString());
        BACKUP_YML_FILE = new File(root.resolve("src/main/resources/application_copy.yml").toString());
    }

    public static List<ChangeSet> getChangeSetsToSave() {
        List<ChangeSet> list = changeSetsToSave;
        changeSetsToSave = null;
        return list;
    }

    public static void run() {
        // checking an existence of changelog file
        if (!CHANGELOG_FILE.exists()) {
            return;
        }

        // checking an existence of application.yml file
        if (!APP_YML_FILE.exists()) {
            log.warn("A file 'application.yml' does not exist");
            return;
        }

        // preparing a file before read
        if (!prepare()) return;
        // prepare method creates a backup file. In case of any exception, this file must be deleted!

        runInternally();
        BACKUP_YML_FILE.delete();
    }

    // // // private zone

    private static boolean prepare() {
        // creating a backup file of application.yml
        try {
            if (!BACKUP_YML_FILE.exists() && !BACKUP_YML_FILE.createNewFile()) {
                return false;
            }
            FileCopyUtils.copy(APP_YML_FILE, BACKUP_YML_FILE);
        } catch (IOException e) {
            log.warn("An error occurred to copy application.yml file");
            return false;
        }

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
            BACKUP_YML_FILE.delete();
            throw new RuntimeException(e);
        }

        try (FileOutputStream fos = new FileOutputStream(APP_YML_FILE)) {
            fos.write(sb.toString().getBytes());
        } catch (IOException e) {
            try {
                FileCopyUtils.copy(BACKUP_YML_FILE, APP_YML_FILE);
            } catch (IOException ignored) {
            }
            return false;
        }
        return true;
    }

    private static void runInternally() {
        // parse application.yml file
        Map<String, Object> appYamlMap = readYAMLFile(APP_YML_FILE);
        if (appYamlMap == null) return;

        // read datasource's configs from yaml file and set datasource to jdbcTemplate
        if (!setDataSource(appYamlMap)) return;

        Map<String, Object> changelog = readYAMLFile(CHANGELOG_FILE);
        if (changelog == null || changelog.isEmpty()) return;

        ChangeSet lastSavedSet = getLastChangeSet();
        String fullVersionOfLastChangeSetInFile = getLastChangeSetVersionToApply(changelog);

        if (lastSavedSet == null) {
            String ocVersion = getOcVersion(appYamlMap);
            lastSavedSet = new ChangeSet();
            lastSavedSet.setVersion(ocVersion);
        }
        // there is not any new changes
        if (fullVersionOfLastChangeSetInFile == null || isGreaterThanOrEqual(lastSavedSet.getVersion(), fullVersionOfLastChangeSetInFile)) {
            return;
        }

        List<ChangeSet> changeSetList = validateAndConvert((ArrayList<Map<String, Object>>) changelog.get("versions"));

        List<ChangeSet> newChangeSets = new ArrayList<>();
        for (ChangeSet changeSet : changeSetList) {
            if (!isGreaterThanOrEqual(lastSavedSet.getVersion(), changeSet.getVersion())) {
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
                if (e.getCause() != null && (e.getCause().getMessage().equals("parent of node to add does not exist") || e.getCause().getMessage().equals("parent of path to add to is not a container"))) {
                    if (PATCH_HELPER.size(singleJsonPatch) == 2) {
                        JsonPatch firstOp = PATCH_HELPER.delete(singleJsonPatch, 1, 2);
                        patched = fillUp(changeSet.getPath().replaceAll("\\.", "/"), firstOp, patched);
                    } else {
                        patched = fillUp(changeSet.getPath().replaceAll("\\.", "/"), singleJsonPatch, patched);
                    }
                    i--;
                } else if (e.getCause() != null && e.getCause().getMessage().equals("value cannot be null")
                        || changeSet.getOperation().equals("delete") && e.getCause() != null && e.getCause().getMessage().equals("no such path in target JSON document")) {
                    changeSet.setSuccess(false);
                } else {
                    log.warn("An error occurred while applying {} - changeset : {}", changeSet.getVersion(), e.getCause() == null ? e.getMessage() : e.getCause().getMessage());
                    finish(patched, newChangeSets.subList(0, i));
                    return;
                }
            }
        }
        finish(patched, newChangeSets);
    }

    private static String getOcVersion(Map<String, Object> map) {
        var oc = (Map<String, Object>) map.get("opencelium");
        return oc.getOrDefault("version", "0.0").toString() + ":-1";
    }

    private static void finish(Object yaml, List<ChangeSet> changeSetsForSave) {
        if (changeSetsForSave.isEmpty()) return;
        //read comments
        List<Comment> commentLines = readComments();
        //replace null variables with empty
        changeRenamedPaths(commentLines, changeSetsForSave);

        try {
            YAML_MAPPER.writeValue(APP_YML_FILE, yaml);
            //write comments
            writeComments(commentLines);
        } catch (IOException e) {
            try {
                FileCopyUtils.copy(BACKUP_YML_FILE, APP_YML_FILE);
            } catch (IOException ex) {
                log.warn("Failed to write application.yml file. Please check application.yml and rerun");
                BACKUP_YML_FILE.delete();
                throw new RuntimeException(ex);
            }
            log.warn("Failed to write YAML file");
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

    private static void changeRenamedPaths(List<Comment> commentLines, List<ChangeSet> changeSets) {
        for (ChangeSet changeSet : changeSets) {
            if (changeSet.getOperation().equals("rename")) {
                for (Comment cl : commentLines) {
                    if (!cl.prev.isEmpty() && cl.prev.equals(changeSet.getPath())) {
                        cl.prev = (String) changeSet.getValue();
                    }
                }
            }
        }
    }

    private static Object fillUp(String path, final JsonPatch jsonPatch, Object obj) {
        JsonPatch parent = PATCH_HELPER.changeEachPath(jsonPatch, x -> x.substring(0, x.lastIndexOf("/")));
        parent = PATCH_HELPER.changeEachValue(parent);
        try {
            return PATCH_HELPER.patch(parent, obj, Object.class);
        } catch (RuntimeException e) {
            if (e.getCause() != null && (e.getCause().getMessage().equals("parent of node to add does not exist") || e.getCause().getMessage().equals("parent of path to add to is not a container"))) {
                return fillUp(path.substring(0, path.lastIndexOf("/")), parent, obj);
            }
            throw e;
        }
    }

    private static boolean isCommentLine(String line) {
        return line.trim().startsWith("#") || line.isEmpty();
    }

    private static String getLastChangeSetVersionToApply(Map<String, Object> changelog) {
        var versions = (ArrayList<Map<String, Object>>) changelog.getOrDefault("versions", new ArrayList<Map<String, Object>>());
        if (versions.isEmpty()) {
            return null;
        }
        var lastVersion = versions.get(versions.size() - 1);
        try {
            String version = lastVersion.get("version").toString();
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
                opList.add(map);
            }
            case "modify" -> {
                map.put("op", "replace");
                map.put("path", "/" + changeSet.getPath().replaceAll("\\.", "/"));
                map.put("value", changeSet.getValue());
                opList.add(map);
            }
            case "delete" -> {
                map.put("op", "remove");
                map.put("path", "/" + changeSet.getPath().replaceAll("\\.", "/"));
                changeSet.setValue(null);
                opList.add(map);
            }
            case "rename" -> {
                Map<String, Object> prev = new HashMap<>();
                String toPath = "/" + ((String) (changeSet.getValue())).replaceAll("\\.", "/");
                prev.put("op", "add");
                prev.put("path", toPath);
                prev.put("value", "");
                opList.add(prev);

                String fromPath = "/" + changeSet.getPath().replaceAll("\\.", "/");
                map.put("op", "move");
                map.put("from", fromPath);
                map.put("path", toPath);
                opList.add(map);
            }
            default -> {
                log.warn("Unsupported operation: {}", changeSet.getOperation());
                return null;
            }
        }
        return OBJECT_MAPPER.convertValue(opList, JsonPatch.class);
    }

    private static List<ChangeSet> validateAndConvert(ArrayList<Map<String, Object>> versions) {
        String regex = "^[0-9]+(?:\\.[0-9]+)*$";
        List<ChangeSet> res = new ArrayList<>();
        for (Map<String, Object> version : versions) {
            if (!version.containsKey("version") || !version.containsKey("changes")) {
                log.warn("Version does not contain 'version' and|or 'changes' field. All the rest changesets are ignored");
                return res;
            }

            String versionVal = version.getOrDefault("version", "").toString();
            if (versionVal == null || !versionVal.matches(regex)) {
                log.warn("{} is not valid version. All the rest changesets are ignored", version.get("version"));
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
                log.warn("An error is occurred while reading changeset. All the rest changesets are ignored");
                return res;
            }
        }
        return res;
    }

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
            log.warn("An error is occurred while connecting to the database");
            return false;
        }
        JDBC_TEMPLATE.setDataSource(dataSource);
        return true;
    }

    private static boolean isGreaterThanOrEqual(String v1, String v2) {
        String[] split1 = v1.split(":");
        String[] split2 = v2.split(":");
        int result = compareVersions(split1[0], split2[0]);
        if (result == 1) {
            return true;
        } else if (result == 0) {
            return Integer.parseInt(split1[1]) >= Integer.parseInt(split2[1]);
        }
        return false;
    }

    // compares
    private static int compareVersions(String v1, String v2) {
        String[] v1Parts = v1.split("\\.");
        String[] v2Parts = v2.split("\\.");

        int length = Math.max(v1Parts.length, v2Parts.length);

        for (int i = 0; i < length; i++) {
            int v1Part = i < v1Parts.length ? Integer.parseInt(v1Parts[i]) : 0;
            int v2Part = i < v2Parts.length ? Integer.parseInt(v2Parts[i]) : 0;

            if (v1Part > v2Part) {
                return 1;
            } else if (v1Part < v2Part) {
                return -1;
            }
        }
        return 0;
    }

    private static ChangeSet getLastChangeSet() {
        try {
            return DAO.getLast();
        } catch (BadSqlGrammarException e) {
            //Table has not been created yet
            return null;
        }
    }

    private static Map<String, Object> readYAMLFile(File file) {
        try {
            return YAML_MAPPER.readValue(file, new TypeReference<>() {
            });
        } catch (IOException e) {
            log.warn("Failed to parse '{}' file", file.getName());
            return null;
        }
    }

    private static LinkedList<String> readFile(File file) {
        LinkedList<String> lines = new LinkedList<>();
        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            lines = new LinkedList<>();
            while ((line = reader.readLine()) != null) {
                lines.add(line);
            }
        } catch (IOException e) {
            log.warn("Unable to read application.yaml file. Comments may be ignored");
        }
        return lines;
    }

    private static List<Comment> readComments() {
        ArrayList<Comment> comments = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new FileReader(APP_YML_FILE))) {
            String line;
            boolean hasPrev = false;
            Stack<String> stack = new Stack<>();
            while ((line = reader.readLine()) != null) {
                if (isCommentLine(line)) {
                    if (!hasPrev) {
                        Comment comment = new Comment();
                        comment.lines.add(line);
                        comment.prev = getFullPath(stack);
                        comments.add(comment);
                    } else {
                        Comment comment = comments.get(comments.size() - 1);
                        comment.lines.add(line);
                    }
                    hasPrev = true;
                } else if (!line.trim().startsWith("-")) {
                    hasPrev = false;
                    if (!stack.isEmpty()) {
                        int prev = Integer.parseInt(stack.peek());
                        String tabs = headingTabs(line);
                        int tabsInt = Integer.parseInt(tabs);
                        if (prev == tabsInt) {
                            stack.pop();
                            stack.pop();
                        } else if (prev > tabsInt) {
                            int diff = (prev - tabsInt) / 2 + 1;
                            while (diff > 0) {
                                diff--;
                                stack.pop();
                                stack.pop();
                            }
                        }
                    }
                    String trim = line.trim();
                    String name = trim.substring(0, trim.indexOf(":"));
                    stack.push(name);
                    stack.push(headingTabs(line));
                }
            }
            return comments;
        } catch (IOException e) {
            log.warn("Unable to read comments from application.yaml file. Some comments may be ignored");
            return comments;
        }
    }

    private static void writeComments(List<Comment> commentLines) throws IOException {
        LinkedList<String> lines = readFile(APP_YML_FILE);

        //sweeping null values
        for (int i = 0; i < lines.size(); i++) {
            if (!isCommentLine(lines.get(i)) && lines.get(i).endsWith(" null")) {
                lines.set(i, lines.get(i).substring(0, lines.get(i).lastIndexOf("null")));
            }
        }

        commentLines.stream()
                .filter(c -> c.prev.isEmpty())
                .findAny()
                .ifPresent(cc -> lines.addAll(0, cc.lines));

        for (Comment comment : commentLines) {
            if (comment.prev.isEmpty()) continue;
            Stack<String> stack = new Stack<>();
            boolean is = false;
            for (int i = 0; i < lines.size(); i++) {
                if (isCommentLine(lines.get(i))) {
                    continue;
                }
                if (!lines.get(i).trim().startsWith("-")) {
                    if (!stack.isEmpty()) {
                        int prev = Integer.parseInt(stack.peek());
                        String tabs = headingTabs(lines.get(i));
                        int tabsInt = Integer.parseInt(tabs);
                        if (prev == tabsInt) {
                            stack.pop();
                            stack.pop();
                        } else if (prev > tabsInt) {
                            int diff = (prev - tabsInt) / 2 + 1;
                            while (diff > 0) {
                                diff--;
                                stack.pop();
                                stack.pop();
                            }
                        }
                    }
                    String trim = lines.get(i).trim();
                    String name = trim.substring(0, trim.indexOf(":"));
                    stack.push(name);
                    stack.push(headingTabs(lines.get(i)));
                }
                String path = getFullPath(stack);
                String root = path.split("\\.")[0];
                if (is && comment.prev.equals(path)) {
                    lines.addAll(i + 1, comment.lines);
                    break;
                }
                if (comment.prev.startsWith(root)) {
                    is = true;
                } else if (is) {
                    lines.addAll(i, comment.lines);
                    break;
                }

                if (lines.size() - 1 == i) {
                    log.error("Cannot find this comment section's place to move:\n{}", comment.lines);
                }
            }
        }

        StringBuilder sb = new StringBuilder();
        lines.forEach(line -> sb.append(line).append("\n"));

        try (FileWriter fw = new FileWriter(APP_YML_FILE)) {
            fw.write(sb.toString());
        } catch (IOException e) {
            log.warn("Cannot move comments into application.yaml file. Comments may be ignored");
        }
    }

    private static String getFullPath(Stack<String> stack) {
        if (stack.isEmpty()) {
            return "";
        }
        var sb = new StringBuilder();
        int i = 0;
        Iterator<String> iterator = stack.elements().asIterator();
        while (iterator.hasNext()) {
            if ((i & 1) == 0) {
                sb.append(iterator.next());
                sb.append(".");
            } else {
                iterator.next();
            }
            i++;
        }
        return sb.deleteCharAt(sb.length() - 1).toString();
    }

    private static String headingTabs(String line) {
        if (!line.startsWith(" ")) {
            return "0";
        }
        int i = -1;
        for (char c : line.toCharArray()) {
            i++;
            if (c != ' ') {
                if ((i & 1) == 0) {
                    return i + "";
                }
                return i + 1 + "";
            }
        }
        return i + "";
    }

    private static class Comment {
        private final List<String> lines = new ArrayList<>();
        private String prev;
    }
}

package com.becon.opencelium.backend.application.assistant;

import com.becon.opencelium.backend.application.entity.AvailableUpdate;
import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.constant.YamlPropConst;
import com.becon.opencelium.backend.resource.application.AvailableUpdateResource;
import com.becon.opencelium.backend.resource.update_assistant.PackageVersionResource;
import com.becon.opencelium.backend.utility.FileNameUtils;
import com.becon.opencelium.backend.utility.PackageVersionManager;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.*;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

@Service
public class UpdatePackageServiceImp implements UpdatePackageService {

    @Autowired
    private ObjectMapper jsonOm;

    @Autowired
    private Environment env;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private AssistantServiceImp assistantServiceImp;

    private Logger logger = LoggerFactory.getLogger(UpdatePackageServiceImp.class);

    @Override
    public List<AvailableUpdate> getOffVersions() {


        String[] directories = getDirectories();

        if (directories == null) {
            return null;
        }
        return getAllAvailableUpdates(directories);
    }

    @Override
    public List<PackageVersionResource> getOnVersions() {
        try {
            return getVersions();
        } catch (Exception e) {
            throw  new RuntimeException(e);
        }
    }

    // assistant/versions/{folder}
    @Override
    public AvailableUpdate getAvailableUpdate(String version) {
        String status = getVersionStatus(version);
        version = version.replace(".", "_");
        AvailableUpdate availableUpdate = new AvailableUpdate();
        availableUpdate.setFolder(version);
        availableUpdate.setStatus(status);
        availableUpdate.setChangelogLink(getChangelogLink(version));
        availableUpdate.setVersion(version);
        availableUpdate.setInstruction(extractInstruction(version));
        return availableUpdate;
    }


    @Override
    public String[] getDirectories() {
        File file = new File(PathConstant.ASSISTANT + PathConstant.VERSIONS);
        return file.list(new FilenameFilter() {
            @Override
            public boolean accept(File current, String name) {
                return new File(current, name).isDirectory();
            }
        });
    }

    @Override
    public AvailableUpdateResource toResource(AvailableUpdate offVersions) {
        AvailableUpdateResource availableUpdateResource = new AvailableUpdateResource();
        availableUpdateResource.setFolder(offVersions.getFolder());
        availableUpdateResource.setStatus(offVersions.getStatus());
        availableUpdateResource.setName(offVersions.getVersion());
        availableUpdateResource.setChangelogLink(offVersions.getChangelogLink());
        availableUpdateResource.setInstruction(offVersions.getInstruction());
        return availableUpdateResource;
    }

    private List<AvailableUpdate> getAllAvailableUpdates(String[] appDirectories) {
        List<AvailableUpdate> packages = new LinkedList<>();
        for (String appDir : appDirectories) {
            AvailableUpdate availableUpdate = getAvailableUpdate(appDir);
            packages.add(availableUpdate);
        }
        return packages;
    }

    private String getChangelogLink(String ocPackage) {
        final URI uri = ServletUriComponentsBuilder.fromCurrentRequest().build().toUri();
        return uri.getScheme() + "://" + uri.getAuthority() + "/api/assistant/changelog/file/" + ocPackage;
    }

    // [1.2, 1.3] :  1.2 - current
    // [1.2, 1.3] :  1.3 - current
    private String getVersionStatus(String version) {
        String currentVersion = assistantServiceImp.getCurrentVersion();
        ArrayList<String> versions = new ArrayList<>();
        versions.add(currentVersion);
        versions.add(version);
        Collections.sort(versions);
        boolean isCurrent = versions.get(1).equalsIgnoreCase(versions.get(0));
        boolean isOld = versions.get(0).equals(version);
        boolean isParent = version.contains(currentVersion);
        if (isCurrent) {
            return "current";
        } else if(isOld) {
            return "old";
        } else if(isParent){
            return "available";
        } else {
            return "available";
        }
    }

    private List<PackageVersionResource> getVersions() throws Exception {
        String packageCloudUrl = "https://packagecloud.io/becon/opencelium";
        String htmlResponse = restTemplate.getForObject(packageCloudUrl, String.class);
        String currentVersion = env.getProperty(YamlPropConst.OC_VERSION);

        Set<String> packVersion = new HashSet<>();
        Document doc = Jsoup.parse(htmlResponse);
        Elements titles = doc.select("a[title*=.zip]");  // Selects all <a> elements with href ending in .zip

        Pattern pattern = Pattern.compile("^oc_\\d+(\\.\\d+)*\\.zip$");
        for (Element title : titles) {
            String version = title.attr("title");
            if (pattern.matcher(version).matches()) {
                packVersion.add(version);
            }
        }

        return PackageVersionManager.getPackageVersions(packVersion, currentVersion);
    }

//    private String getVersions() throws Exception {
//        String version  = assistantServiceImp.getCurrentVersion();
//        String endpoint = "p984zhugh3443g8-438ghi4uh34g83-03ugoigh498t53y-" +
//                "483hy4pgh438ty3948gh34p8g-34ug394gheklrghdgopwuew09327-89f/" + version;
//        long date = new Date().getTime();
//        String url = "https://service.opencelium.io:443/api/" + endpoint;
//
//        HttpMethod method = HttpMethod.GET;
//        HttpHeaders header = new HttpHeaders();
//        header.set("x-access-token", "qpoeqavncbms09248527qrkazmvbgw9328uq0akzvzncbjgwh3pw09r0iavlhgwe98y349t8ghergiueh49230ur29ut3hg9");
//        header.set("x-sp-timestamp", String.valueOf(date));
//
//        String signature = generateSignature("tp2wwig91eo7kh2sa3rgsas3apw81uw3sdw9t8wigjvmdvcv", "GET", "/api/" + endpoint, String.valueOf(date)).toLowerCase();
//        header.set("x-sp-signature", signature);
//        HttpEntity<Object> httpEntity = new HttpEntity <Object> (header);
//        ResponseEntity<String> response = restTemplate.exchange(url, method ,httpEntity, String.class);
//        return response.getBody();
//    }

    //'tp2wwig91eo7kh2sa3rgsas3apw81uw3sdw9t8wigjvmdvcv', 'GET', `/api/${endpoint}`, currentDate
    private String generateSignature(String key, String httpMethod, String url, String currentDate) {
        byte[] hmacSha256 = null;
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(), "HmacSHA256");
            mac.init(secretKeySpec);
            String message = httpMethod.toUpperCase() + url + currentDate;
            mac.update(message.getBytes());
            hmacSha256 = mac.doFinal();
        } catch (Exception e) {
            throw new RuntimeException("Failed to calculate hmac-sha256", e);
        }
        return bytesToHex(hmacSha256);

    }

    private static final byte[] HEX_ARRAY = "0123456789ABCDEF".getBytes(StandardCharsets.US_ASCII);
    public static String bytesToHex(byte[] bytes) {
        byte[] hexChars = new byte[bytes.length * 2];
        for (int j = 0; j < bytes.length; j++) {
            int v = bytes[j] & 0xFF;
            hexChars[j * 2] = HEX_ARRAY[v >>> 4];
            hexChars[j * 2 + 1] = HEX_ARRAY[v & 0x0F];
        }
        return new String(hexChars, StandardCharsets.UTF_8);
    }

    /**
     * Reads the content of a specified file inside a zip archive into a single string.
     * @param versionFolder Path to the zip file.
     * @return The content of the file as a string.
     * @throws IOException If an I/O error occurs reading from the zip file or if the file is not found.
     */
    private String extractInstruction(String versionFolder) {

        try {
            String zipFilePath = PathConstant.ASSISTANT + PathConstant.VERSIONS + versionFolder;
            File file = findFirstZipFileFromVersionFolder(zipFilePath);
            String folder = FileNameUtils.removeExtension(file.getName());
            String instructionPath = folder + "/" +PathConstant.INSTRUCTION;
            // Open the zip file
            try (ZipFile zipFile = new ZipFile(file)) {
                // Get the zip entry for the specific file
                ZipEntry entry = zipFile.getEntry(instructionPath);
                if (entry == null) {
                    logger.warn("File " + instructionPath + " not found in the zip archive. Folder: " + versionFolder);
                    return "";
                }

                // Read the content of the file
                try (InputStream stream = zipFile.getInputStream(entry);
                     BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
                    StringBuilder contentBuilder = new StringBuilder();
                    String line;

                    // Read each line from the BufferedReader and append it to the StringBuilder
                    while ((line = reader.readLine()) != null) {
                        contentBuilder.append(line).append(System.lineSeparator());
                    }

                    // Return the string content of the file
                    return contentBuilder.toString();
                }
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private File findFirstZipFileFromVersionFolder(String directoryPath) throws IOException {
        File dir = new File(directoryPath);

        // Ensure the directory path is valid and it is a directory
        if (!dir.exists() || !dir.isDirectory()) {
            throw new IOException("Provided path is not a directory.");
        }

        // Find the first zip file in the directory
        File[] files = dir.listFiles((d, name) -> name.endsWith(".zip"));
        if (files == null || files.length == 0) {
            throw new IOException("No zip files found in the directory.");
        }
        return files[0];
    }
}

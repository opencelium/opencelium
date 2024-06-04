package com.becon.opencelium.backend.utility;

import com.becon.opencelium.backend.application.entity.AvailableUpdate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PackageVersionManager {


    public static List<AvailableUpdate> getPackageVersions(Set<String> packageVersions, String currentVersion) {
        List<String> versions = packageVersions.stream()
                .map(name -> name.replace("oc_", "").replace(".zip", ""))
                .sorted(PackageVersionManager::compareVersions).toList();

        List<AvailableUpdate> packageVersionResources = new ArrayList<>();
        boolean foundHigherVersion = false;

        for (String version : versions) {
            String status;
            if (compareVersions(version, currentVersion) < 0) {
                status = "old";
            } else if (compareVersions(version, currentVersion) == 0) {
                status = "current";
            } else {
                if (!foundHigherVersion) {
                    status = "available";
                    foundHigherVersion = true;
                } else {
                    status = "not available";
                }
            }
            packageVersionResources.add(new AvailableUpdate(version, status));
        }
        return packageVersionResources;
    }

    public static int compareVersions(String version1, String version2) {
        String[] parts1 = version1.split("\\.");
        String[] parts2 = version2.split("\\.");

        int length = Math.max(parts1.length, parts2.length);
        for (int i = 0; i < length; i++) {
            int v1 = i < parts1.length ? Integer.parseInt(parts1[i]) : 0;
            int v2 = i < parts2.length ? Integer.parseInt(parts2[i]) : 0;
            if (v1 < v2) return -1;
            if (v1 > v2) return 1;
        }
        return 0;
    }

    public static List<Integer> parseVersion(String version) {
        return Arrays.stream(version.split("\\."))
                .map(Integer::parseInt)
                .collect(Collectors.toList());
    }
}

package com.becon.opencelium.backend.utility;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.LinkedHashMap;
import java.util.Map;

public class MachineUtility {

    private static final String CMD_GET_UUID_WIN = "wmic csproduct get UUID";
    private static final String CMD_GET_UUID_LIN_OR_MAC = "cat /etc/machine-id";

    private static final String CMD_GET_SYS_ID_WIN = "wmic csproduct get UUID";
//    public static final String CMD_GET_Proc_ID_LINUX = "lscpu | grep 'Serial'";
    private static final String CMD_GET_SYS_ID_LINUX = "dmidecode -s system-uuid";
    private static final String CMD_GET_SYS_ID_MAC = "ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID";

    private MachineUtility() {}
    public static String getMachineUUID() {
//        return "MACHINE_UUID";
        String uuid = null;
        String os = System.getProperty("os.name").toLowerCase();

        try {
            Process process = null;
            if (os.contains("win")) {
                // Windows command to get the UUID
                process = Runtime.getRuntime().exec(CMD_GET_UUID_WIN);
            } else if (os.contains("nix") || os.contains("nux") || os.contains("mac")) {
                // Linux/Mac command to get the UUID
                process = Runtime.getRuntime().exec(CMD_GET_UUID_LIN_OR_MAC);
            }

            if (process != null) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
                String line;
                while ((line = reader.readLine()) != null) {
                    // For Windows, skip the first line
                    if (!line.isEmpty() && !line.contains("UUID")) {
                        uuid = line.trim();
                        break;
                    }
                }
                reader.close();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return uuid == null ? "" : uuid;
    }

    public static String getMacAddress() {
//        return "MAC_ADDRESS";
        try {
            InetAddress localHost = InetAddress.getLocalHost();
            NetworkInterface networkInterface = NetworkInterface.getByInetAddress(localHost);

            byte[] macBytes = networkInterface.getHardwareAddress();

            if (macBytes == null) {
                return "";
            }

            // Convert the byte array to a readable MAC address format
            StringBuilder macAddress = new StringBuilder();
            for (int i = 0; i < macBytes.length; i++) {
                macAddress.append(String.format("%02X", macBytes[i]));
                if (i < macBytes.length - 1) {
                    macAddress.append("-");
                }
            }

            return macAddress.toString();

        } catch (Exception e) {
            e.printStackTrace();
            return "";
        }
    }

    public static String getSystemUuid() {
//        return "PROCESSOR_ID";
        String os = System.getProperty("os.name").toLowerCase();
        try {
            if (os.contains("win")) {
                return getWindowsUUID();
            } else if (os.contains("nix") || os.contains("nux")) {
                return getLinuxUUID();
            } else if (os.contains("mac")) {
                return getMacUUID();
            } else {
                throw new UnsupportedOperationException("Operating system not supported for fetching System UUID.");
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

    }

    public static String getComputerName() {
//        return "COMPUTER_NAME";
        try {
            InetAddress localHost = InetAddress.getLocalHost();
            return localHost.getHostName() == null ? "" : localHost.getHostName();
        } catch (Exception e) {
            e.printStackTrace();
            return "";
        }
    }

    public static String getStringForHmacEncode() {
        // Collect values and parameter names in pairs
        Map<String, String> parameters = new LinkedHashMap<>();
        parameters.put("Machine UUID", MachineUtility.getMachineUUID());
        parameters.put("MAC Address", MachineUtility.getMacAddress());
        parameters.put("System ID", MachineUtility.getSystemUuid());
        parameters.put("Computer Name", MachineUtility.getComputerName());

        StringBuilder missingParameters = new StringBuilder();
        StringBuilder result = new StringBuilder();

        // Iterate over the parameters and check for empty or null values
        for (Map.Entry<String, String> entry : parameters.entrySet()) {
            String value = entry.getValue();
            if (value == null || value.isEmpty()) {
                missingParameters.append(entry.getKey()).append(" is empty. ");
            } else {
                result.append(value); // Append the value to the result if it's valid
            }
        }

        // Throw exception if any parameters are missing
        if (missingParameters.length() > 0) {
            throw new IllegalArgumentException(missingParameters.toString() + "Please fill them or grant permissions.");
        }

        return result.toString();
    }


    private static String getWindowsUUID() throws Exception {
        Process process = Runtime.getRuntime().exec("wmic csproduct get UUID");
        BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
        String line;
        while ((line = reader.readLine()) != null) {
            if (line != null && !line.isEmpty() && !line.startsWith("UUID")) {
                return line.trim();  // Return the UUID from Windows command
            }
        }
        return "";  // Return null if UUID is not found
    }

    private static String getLinuxUUID() throws Exception {
        String[] cmd = { "/bin/sh", "-c", "dmidecode -s system-uuid" };
        Process process = Runtime.getRuntime().exec(cmd);
        BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
        String line;
        while ((line = reader.readLine()) != null) {
            if (line != null && !line.isEmpty()) {
                return line.trim();  // Return the UUID from Linux command
            }
        }
        return "";  // Return null if UUID is not found
    }

    private static String getMacUUID() throws Exception {
        String[] cmd = { "/bin/sh", "-c", "ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID" };
        Process process = Runtime.getRuntime().exec(cmd);
        BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
        String line;
        while ((line = reader.readLine()) != null) {
            if (line.contains("IOPlatformUUID")) {
                String[] parts = line.split("\"");  // Extract UUID from the output
                return parts[3].trim();  // Return the UUID from macOS command
            }
        }
        return "";  // Return null if UUID is not found
    }
}

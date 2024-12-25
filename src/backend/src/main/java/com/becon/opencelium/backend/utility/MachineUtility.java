package com.becon.opencelium.backend.utility;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.LinkedHashMap;
import java.util.Map;

public class MachineUtility {

    private MachineUtility() {}
    public static String getMachineUUID() {
//        return "MACHINE_UUID";
        String os = System.getProperty("os.name").toLowerCase();
        String command;

        if (os.contains("win")) {
            command = "wmic csproduct get UUID";
        } else if (os.contains("mac")) {
            command = "system_profiler SPHardwareDataType | grep 'Hardware UUID' | awk '{print $3}'";
        } else if (os.contains("nix") || os.contains("nux")) {
            command = "sudo dmidecode -s system-uuid";
        } else {
            throw new UnsupportedOperationException("Unsupported OS: " + os);
        }

        return executeCommand(command);
//        return uuid == null ? "" : uuid;
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
        String command;

        if (os.contains("win")) {
            command = "wmic bios get serialnumber";
        } else if (os.contains("mac")) {
            command = "system_profiler SPHardwareDataType | awk '/Serial/ {print $4}'";
        } else if (os.contains("nix") || os.contains("nux")) {
            command = "sudo dmidecode -s system-serial-number";
        } else {
            throw new UnsupportedOperationException("Unsupported OS: " + os);
        }

        return executeCommand(command);
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
        parameters.put("System UUID", MachineUtility.getSystemUuid());
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
            throw new IllegalArgumentException(missingParameters + "Please grant permissions.");
        }

        return result.toString();
    }

    private static String executeCommand(String command) {
        StringBuilder result = new StringBuilder();
        try {
            ProcessBuilder builder = new ProcessBuilder();
            if (System.getProperty("os.name").toLowerCase().contains("win")) {
                builder.command("cmd.exe", "/c", command);
            } else {
                builder.command("sh", "-c", command);
            }
            Process process = builder.start();

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    result.append(line).append("\n");
                }
            }

            process.waitFor();
            String output = result.toString().trim();

            // Handle specific parsing if needed for commands with headers, e.g., Windows wmic
            if (command.contains("wmic")) {
                String[] lines = output.split("\\R");
                if (lines.length > 1) {
                    output = lines[1].trim();
                }
            }

            return output.isEmpty() ? "" : output;
        } catch (Exception e) {
            e.printStackTrace();
            return "";
        }
    }

}

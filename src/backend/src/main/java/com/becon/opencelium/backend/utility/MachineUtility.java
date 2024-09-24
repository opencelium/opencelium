package com.becon.opencelium.backend.utility;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.InetAddress;
import java.net.NetworkInterface;

public class MachineUtility {

    public static final String CMD_GET_UUID_WIN = "wmic csproduct get UUID";
    public static final String CMD_GET_UUID_LIN_OR_MAC = "cat /etc/machine-id";

    public static final String CMD_GET_Proc_ID_WIN = "wmic cpu get ProcessorId";
//    public static final String CMD_GET_Proc_ID_LINUX = "lscpu | grep 'Serial'";
    public static final String[] CMD_GET_Proc_ID_LINUX = { "/bin/sh", "-c", "dmidecode -t processor | grep ID" };
    public static final String CMD_GET_Proc_ID_MAC = "system_profiler SPHardwareDataType | grep 'Serial Number'";

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

    public static String getProcessorId() {
//        return "PROCESSOR_ID";
        String processorId = null;
        String os = System.getProperty("os.name").toLowerCase();

        try {
            Process process = null;
            if (os.contains("win")) {
                // Windows command to get the processor ID
                process = Runtime.getRuntime().exec(CMD_GET_Proc_ID_WIN);
            } else if (os.contains("nix") || os.contains("nux")) {
                // Linux command to get the processor ID
                process = Runtime.getRuntime().exec(CMD_GET_Proc_ID_LINUX);
            } else if (os.contains("mac")) {
                // macOS command to get the hardware UUID (as macOS doesn't have a straightforward processor ID)
                process = Runtime.getRuntime().exec(CMD_GET_Proc_ID_MAC);
            }

            if (process != null) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
                String line;
                while ((line = reader.readLine()) != null) {
                    if (os.contains("win")) {
                        if (!line.isEmpty() && !line.contains("ProcessorId")) {
                            processorId = line.trim();
                            break;
                        }
                    } else {
                        // For Linux or macOS, split by colon to get the ID part
                        String[] parts = line.split(":");
                        if (parts.length > 1) {
                            processorId = parts[1].trim();
                            break;
                        }
                    }
                }
                reader.close();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return processorId == null ? "" : processorId;
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
        return MachineUtility.getMachineUUID()
                + MachineUtility.getMacAddress()
                + MachineUtility.getProcessorId()
                + (MachineUtility.getComputerName() == null ? "" : MachineUtility.getComputerName());
    }
}

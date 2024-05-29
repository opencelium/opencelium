package com.becon.opencelium.backend.utility;

import org.springframework.http.MediaType;

public class MediaTypeUtility {

    public static boolean isJsonCompatible(MediaType mediaType) {
        if (mediaType == null) {
            return true; // Json is default type
        }

        return "application".equals(mediaType.getType()) && mediaType.getSubtype().contains("json");
    }

    public static boolean isXmlCompatible(MediaType mediaType) {
        if (mediaType == null) {
            return false;
        }

        return ("application".equals(mediaType.getType()) || "text".equals(mediaType.getType())) && mediaType.getSubtype().contains("xml");
    }

    public static boolean isTextPlainCompatible(MediaType mediaType) {
        return MediaType.TEXT_PLAIN.isCompatibleWith(mediaType);
    }

    public static boolean isFormUrlencodedCompatible(MediaType mediaType) {
        return MediaType.APPLICATION_FORM_URLENCODED.isCompatibleWith(mediaType);
    }
}

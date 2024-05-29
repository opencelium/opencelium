package com.becon.opencelium.backend.utility;

import org.springframework.http.MediaType;

public class MediaTypeUtility {

    public static boolean isJsonCompatible(MediaType mediaType) {
        return MediaType.APPLICATION_JSON.isCompatibleWith(mediaType);
    }

    public static boolean isXmlCompatible(MediaType mediaType) {
        return MediaType.APPLICATION_XML.isCompatibleWith(mediaType);
    }

    public static boolean isTextPlainCompatible(MediaType mediaType) {
        return MediaType.TEXT_PLAIN.isCompatibleWith(mediaType);
    }

    public static boolean isFormUrlencodedCompatible(MediaType mediaType) {
        return MediaType.APPLICATION_FORM_URLENCODED.isCompatibleWith(mediaType);
    }
}

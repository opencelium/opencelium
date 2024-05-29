package com.becon.opencelium.backend.utility;

import org.springframework.http.MediaType;

import java.util.HashSet;
import java.util.Set;

public class MediaTypeUtility {
    private static final Set<MediaType> JSON_COMPATIBLES;
    private static final Set<MediaType> XML_COMPATIBLES;

    static {
        // initialize JSON compatible types
        JSON_COMPATIBLES = new HashSet<>();
        JSON_COMPATIBLES.add(null); // Json is default type
        JSON_COMPATIBLES.add(MediaType.ALL); // Json is default type
        JSON_COMPATIBLES.add(MediaType.APPLICATION_JSON);
        JSON_COMPATIBLES.add(MediaType.APPLICATION_JSON_UTF8);
        JSON_COMPATIBLES.add(MediaType.APPLICATION_GRAPHQL);
        JSON_COMPATIBLES.add(MediaType.APPLICATION_NDJSON);
        JSON_COMPATIBLES.add(MediaType.APPLICATION_PROBLEM_JSON);
        JSON_COMPATIBLES.add(MediaType.APPLICATION_PROBLEM_JSON_UTF8);
        JSON_COMPATIBLES.add(MediaType.APPLICATION_STREAM_JSON);

        // initialize XML compatible types
        XML_COMPATIBLES = new HashSet<>();
        XML_COMPATIBLES.add(MediaType.APPLICATION_XML);
        XML_COMPATIBLES.add(MediaType.APPLICATION_ATOM_XML);
        XML_COMPATIBLES.add(MediaType.APPLICATION_PROBLEM_XML);
        XML_COMPATIBLES.add(MediaType.APPLICATION_RSS_XML);
        XML_COMPATIBLES.add(MediaType.APPLICATION_XHTML_XML);
        XML_COMPATIBLES.add(MediaType.TEXT_XML);
    }

    public static boolean isJsonCompatible(MediaType mediaType) {
        return JSON_COMPATIBLES.contains(mediaType);
    }

    public static boolean isXmlCompatible(MediaType mediaType) {
        return XML_COMPATIBLES.contains(mediaType);
    }

    public static boolean isTextPlainCompatible(MediaType mediaType) {
        return MediaType.TEXT_PLAIN.isCompatibleWith(mediaType);
    }

    public static boolean isFormUrlencodedCompatible(MediaType mediaType) {
        return MediaType.APPLICATION_FORM_URLENCODED.isCompatibleWith(mediaType);
    }
}

package com.becon.opencelium.backend.application.language;

import java.util.List;
import java.util.Optional;

/**
 * Single source of truth for the user interface languages OpenCelium supports.
 *
 * <p>Replaces the former hard-coded {@code LangEnum}: the set of languages now comes from the
 * {@code opencelium.language} block of {@code application.yml}, so adding one is a configuration
 * change plus a frontend translation bundle, not a code change.
 *
 * <p>Codes are ISO 639-1, lowercase, two letters ({@code en}, {@code de}). Anything entering the
 * backend from an older database row, an LDAP directory or an API client should be passed through
 * {@link #normalize(String)} first — historically OpenCelium also stored ISO 639-2 codes such as
 * {@code eng}.
 */
public interface LanguageService {

    /** Returns the configured default language as a canonical ISO 639-1 code. */
    String getDefault();

    /** Returns the supported languages as canonical ISO 639-1 codes, in configured order. */
    List<String> getSupported();

    /**
     * Returns whether the given code denotes a supported language. Accepts any spelling that
     * {@link #normalize(String)} understands.
     */
    boolean isSupported(String code);

    /**
     * Canonicalizes a language code to lowercase ISO 639-1, resolving legacy spellings.
     *
     * <p>Handles ISO 639-2 codes ({@code eng}, {@code ger}, {@code deu}), region-qualified tags
     * ({@code en_US}, {@code de-DE}) and English display names ({@code English}). Returns an empty
     * optional when the input is blank or denotes no known language; a canonical code is not
     * necessarily a supported one, so callers that need both should also check
     * {@link #isSupported(String)}.
     */
    Optional<String> normalize(String code);

    /**
     * Returns the English display name of a supported language, e.g. {@code "German"} for
     * {@code de}, for presentation in language pickers.
     */
    String displayName(String code);
}

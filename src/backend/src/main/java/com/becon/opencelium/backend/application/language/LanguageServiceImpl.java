package com.becon.opencelium.backend.application.language;

import com.becon.opencelium.backend.constant.props.LanguageProps;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.MissingResourceException;
import java.util.Optional;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Validates the configured languages once at startup and answers every language question from that
 * immutable snapshot. A misconfigured {@code opencelium.language} block fails the context so the
 * problem surfaces at boot rather than on the first notification that needs a translation.
 */
@Service
public class LanguageServiceImpl implements LanguageService {

    private static final Logger logger = LoggerFactory.getLogger(LanguageServiceImpl.class);

    /**
     * ISO 639-2/B ("bibliographic") codes, which differ from the 639-2/T codes the JDK reports and
     * therefore cannot be derived from {@link Locale}. Only the languages whose two variants differ
     * are listed.
     */
    private static final Map<String, String> BIBLIOGRAPHIC_CODES = Map.of(
            "ger", "de",
            "fre", "fr",
            "dut", "nl",
            "gre", "el",
            "cze", "cs",
            "ice", "is",
            "per", "fa",
            "rum", "ro",
            "slo", "sk",
            "wel", "cy");

    private static final Set<String> ISO_639_1_CODES = Set.of(Locale.getISOLanguages());
    private static final Map<String, String> ISO_639_2_CODES = buildIso639_2Index();
    private static final Map<String, String> DISPLAY_NAMES = buildDisplayNameIndex();

    private final String defaultCode;
    private final List<String> supported;

    public LanguageServiceImpl(LanguageProps props) {
        this.supported = canonicalizeSupported(props.getSupported());
        this.defaultCode = canonicalizeDefault(props.getDefaultCode(), this.supported);
        logger.info("Supported interface languages: {}, default: {}", this.supported, this.defaultCode);
    }

    @Override
    public String getDefault() {
        return defaultCode;
    }

    @Override
    public List<String> getSupported() {
        return supported;
    }

    @Override
    public boolean isSupported(String code) {
        return normalize(code).filter(supported::contains).isPresent();
    }

    @Override
    public Optional<String> normalize(String code) {
        return canonicalize(code);
    }

    @Override
    public String displayName(String code) {
        return normalize(code)
                .map(canonical -> new Locale(canonical).getDisplayLanguage(Locale.ENGLISH))
                .orElseThrow(() -> new IllegalArgumentException("Unknown language code: " + code));
    }

    private static List<String> canonicalizeSupported(List<String> configured) {
        if (configured == null || configured.isEmpty()) {
            throw new IllegalStateException(
                    "opencelium.language.supported must list at least one language");
        }

        List<String> canonical = new ArrayList<>(configured.size());
        for (String code : configured) {
            String normalized = normalizeOrThrow(code, "opencelium.language.supported");
            if (!canonical.contains(normalized)) {
                canonical.add(normalized);
            }
        }
        return List.copyOf(canonical);
    }

    private static String canonicalizeDefault(String configured, List<String> supported) {
        String normalized = normalizeOrThrow(configured, "opencelium.language.default");
        if (!supported.contains(normalized)) {
            throw new IllegalStateException(
                    "opencelium.language.default '" + normalized
                            + "' is not listed in opencelium.language.supported " + supported);
        }
        return normalized;
    }

    private static String normalizeOrThrow(String code, String property) {
        return canonicalize(code)
                .orElseThrow(() -> new IllegalStateException(
                        property + " contains an unknown language code: '" + code + "'"));
    }

    /** Implements {@link #normalize(String)}; static so the constructor can use it. */
    private static Optional<String> canonicalize(String code) {
        if (code == null || code.isBlank()) {
            return Optional.empty();
        }

        // Strip any region or script subtag: "en_US" and "de-DE" both denote a supported language.
        String candidate = code.trim().replace('_', '-');
        int subtagStart = candidate.indexOf('-');
        if (subtagStart > 0) {
            candidate = candidate.substring(0, subtagStart);
        }
        candidate = candidate.toLowerCase(Locale.ROOT);

        if (ISO_639_1_CODES.contains(candidate)) {
            return Optional.of(candidate);
        }
        String fromIso639_2 = ISO_639_2_CODES.get(candidate);
        if (fromIso639_2 != null) {
            return Optional.of(fromIso639_2);
        }
        return Optional.ofNullable(DISPLAY_NAMES.get(candidate));
    }

    private static Map<String, String> buildIso639_2Index() {
        Map<String, String> index = new HashMap<>();
        for (String code : Locale.getISOLanguages()) {
            try {
                index.putIfAbsent(new Locale(code).getISO3Language(), code);
            } catch (MissingResourceException e) {
                // Language has no three-letter code; nothing to index.
            }
        }
        index.putAll(BIBLIOGRAPHIC_CODES);
        return Map.copyOf(index);
    }

    private static Map<String, String> buildDisplayNameIndex() {
        Map<String, String> index = new HashMap<>();
        for (String code : Locale.getISOLanguages()) {
            String name = new Locale(code).getDisplayLanguage(Locale.ENGLISH);
            if (!name.isBlank()) {
                index.putIfAbsent(name.toLowerCase(Locale.ROOT), code);
            }
        }
        return Map.copyOf(index);
    }
}

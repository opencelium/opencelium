package com.becon.opencelium.backend.constant.props;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.boot.context.properties.bind.Name;

/**
 * User interface language settings, bound from the {@code opencelium.language} block of
 * {@code application.yml}.
 *
 * <p>This is a plain configuration holder. The values are neither canonicalized nor validated here
 * — that happens once at startup in
 * {@link com.becon.opencelium.backend.application.language.LanguageService}, which is the only
 * component that should be consulted for language decisions.
 *
 * <p>The defaults below intentionally mirror the languages OpenCelium shipped before the setting
 * became configurable, so an installation whose {@code application.yml} predates this block keeps
 * working unchanged.
 */
@ConfigurationProperties(prefix = "opencelium.language")
public class LanguageProps {

    /** Language used when a user has none set, or has one that is no longer supported. */
    private final String defaultCode;

    /** Languages offered by the user interface, in the order they should be presented. */
    private final List<String> supported;

    public LanguageProps(
            @Name("default") @DefaultValue("en") String defaultCode,
            @DefaultValue({"en", "de"}) List<String> supported) {
        this.defaultCode = defaultCode;
        this.supported = supported;
    }

    public String getDefaultCode() {
        return defaultCode;
    }

    public List<String> getSupported() {
        return supported;
    }
}

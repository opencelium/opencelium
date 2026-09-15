package io.opencelium.core.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

/**
 * The root of trust.
 *
 * <p>The master key decrypts every stored credential, so it can never live in the database it
 * protects, and never in a file in this repository: it comes from the {@code OC_MASTER_KEY}
 * environment variable through the placeholder in {@code application.yaml}.
 *
 * <p>The key carries only {@link NotBlank}. Its length and encoding are checked in {@code MasterKey}
 * instead, because a failed validation constraint prints the offending <em>value</em> in the startup
 * failure report — which for a key would print the key.
 */
@Validated
@ConfigurationProperties(prefix = "opencelium.security", ignoreUnknownFields = false)
public record SecurityProperties(

        @NotBlank String masterKey,

        @NotNull @DefaultValue("mongo") Provider secretProvider) {

    public enum Provider {
        /** Encrypted documents in MongoDB. The default, and the only one implemented today. */
        MONGO,
        /** Reserved: HashiCorp Vault. */
        VAULT,
        /** Reserved: a cloud KMS. */
        KMS
    }

    @Override
    public String toString() {
        return "SecurityProperties[masterKey=***, secretProvider=" + secretProvider + "]";
    }
}

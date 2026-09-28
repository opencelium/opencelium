package com.becon.opencelium.backend.constant.props;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Remote repository that holds the distributable invoker xml files.
 *
 * <p>{@code url} points at a GitHub Contents API folder (e.g.
 * {@code https://api.github.com/repos/opencelium/opencelium/contents/src/backend/runtime/invoker})
 * and {@code branch} is the git ref the files are read from.
 */
@Validated
@ConfigurationProperties(prefix = "opencelium.invoker-repository")
public record InvokerRepositoryProps(
        @NotBlank String url,
        @NotBlank String branch
) {}

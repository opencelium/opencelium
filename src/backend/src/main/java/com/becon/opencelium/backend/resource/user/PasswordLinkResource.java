package com.becon.opencelium.backend.resource.user;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.Instant;

/**
 * A one-time set-password link an admin issued for a user.
 *
 * @param link      the link to the frontend's set-password page, carrying the raw token. It is
 *                  returned this once and never stored, so it cannot be fetched again; issuing a
 *                  new link invalidates this one
 * @param expiresAt when the link stops working
 */
public record PasswordLinkResource(
        String link,
        @JsonFormat(shape = JsonFormat.Shape.STRING) Instant expiresAt) {
}

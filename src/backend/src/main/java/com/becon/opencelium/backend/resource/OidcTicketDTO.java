package com.becon.opencelium.backend.resource;

/**
 * '/oidc/exchange' body. 'clientNonce' is what the browser that started the login kept from
 * /oidc/authorize; without it the ticket is refused, so a ticket cannot be spent elsewhere.
 */
public record OidcTicketDTO(String code, String clientNonce) {
}

/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.scheduler;

import com.becon.opencelium.backend.database.mysql.repository.OidcLoginTicketRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;

/**
 * Removes one-time OIDC login tickets that were consumed or never used before they expired.
 */
@Component
public class OidcLoginTicketSweeper {

    private final OidcLoginTicketRepository ticketRepository;

    public OidcLoginTicketSweeper(OidcLoginTicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

    @Scheduled(fixedDelay = 600_000)
    @Transactional
    public void sweep() {
        ticketRepository.deleteConsumed(new Date());
    }
}

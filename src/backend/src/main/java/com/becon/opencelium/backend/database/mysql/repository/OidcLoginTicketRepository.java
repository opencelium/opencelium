/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.OidcLoginTicket;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.Optional;

@Repository
public interface OidcLoginTicketRepository extends JpaRepository<OidcLoginTicket, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select ticket from OidcLoginTicket ticket where ticket.ticket = :ticket")
    Optional<OidcLoginTicket> findForUpdate(@Param("ticket") String ticket);

    @Modifying
    @Query("delete from OidcLoginTicket ticket where ticket.expiresAt < :now or ticket.usedAt is not null")
    void deleteConsumed(@Param("now") Date now);
}

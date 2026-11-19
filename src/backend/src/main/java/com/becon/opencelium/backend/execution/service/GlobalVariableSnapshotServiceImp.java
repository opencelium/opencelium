package com.becon.opencelium.backend.execution.service;

import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.database.mysql.repository.ConnectionRepository;
import com.becon.opencelium.backend.database.mysql.repository.GlobalVariableRepository;
import com.becon.opencelium.backend.database.mysql.service.GlobalVariableScopeResolver;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableKind;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableScopeType;
import com.becon.opencelium.backend.exception.WrongDecryptException;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableSnapshot;
import com.becon.opencelium.backend.utility.crypto.GlobalVariableCipher;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.NullNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

/**
 * Takes snapshots of global variables.
 *
 * <p>The value of a secret is decrypted here, into the snapshot only: the entity keeps the
 * encrypted text, so nothing decrypted is ever written back. A secret that cannot be decrypted
 * still gets its entry, which fails where the run reads it, so a run that does not use it goes
 * on.
 */
@Service
public class GlobalVariableSnapshotServiceImp implements GlobalVariableSnapshotService {

    // a script variable holds code, not a value, so it is no part of the value snapshot
    private static final Set<GlobalVariableKind> KINDS_WITH_VALUE =
            EnumSet.of(GlobalVariableKind.CONSTANT, GlobalVariableKind.MUTABLE);

    private static final Logger log = LoggerFactory.getLogger(GlobalVariableSnapshotServiceImp.class);

    private final GlobalVariableRepository globalVariableRepository;
    private final ConnectionRepository connectionRepository;
    private final GlobalVariableScopeResolver scopeResolver;
    private final ObjectMapper objectMapper;
    private final GlobalVariableCipher cipher;

    public GlobalVariableSnapshotServiceImp(
            GlobalVariableRepository globalVariableRepository,
            ConnectionRepository connectionRepository,
            GlobalVariableScopeResolver scopeResolver,
            ObjectMapper objectMapper,
            GlobalVariableCipher cipher) {
        this.globalVariableRepository = globalVariableRepository;
        this.connectionRepository = connectionRepository;
        this.scopeResolver = scopeResolver;
        this.objectMapper = objectMapper;
        this.cipher = cipher;
    }

    @Override
    @Transactional(readOnly = true)
    public GlobalVariableSnapshot takeFor(long connectionId) {
        // one query for every variable, however many of them the workflow references
        List<GlobalVariable> variables = globalVariableRepository.findAllWithScopeTargets(KINDS_WITH_VALUE);
        if (variables.isEmpty()) {
            return GlobalVariableSnapshot.empty();
        }

        Integer categoryId = connectionRepository.findById(connectionId)
                .map(Connection::getCategoryId)
                .orElse(null);
        Set<Long> categoryIds = scopeResolver.categoryChainOf(categoryId);

        return GlobalVariableSnapshot.of(variables.stream()
                .filter(variable -> variable.isInScopeOf(connectionId, categoryIds))
                .map(this::toEntry)
                .toList());
    }

    @Override
    @Transactional(readOnly = true)
    public GlobalVariableSnapshot takeOpenToAll() {
        return GlobalVariableSnapshot.of(globalVariableRepository.findAllWithScopeTargets(KINDS_WITH_VALUE).stream()
                .filter(variable -> variable.getScopeType() == GlobalVariableScopeType.ALL)
                .map(this::toEntry)
                .toList());
    }

    @Override
    public GlobalVariableSnapshot takeOf(Collection<GlobalVariable> variables) {
        return GlobalVariableSnapshot.of(variables.stream()
                .filter(variable -> KINDS_WITH_VALUE.contains(variable.getKind()))
                .map(this::toEntry)
                .toList());
    }

    private GlobalVariableSnapshot.Entry toEntry(GlobalVariable variable) {
        boolean openToAll = variable.getScopeType() == GlobalVariableScopeType.ALL;
        if (variable.isSecret()) {
            return toSecretEntry(variable, openToAll);
        }

        return new GlobalVariableSnapshot.Entry(variable.getName(), variable.getVersion(), parse(variable), openToAll);
    }

    private GlobalVariableSnapshot.Entry toSecretEntry(GlobalVariable variable, boolean openToAll) {
        String name = variable.getName();
        long version = variable.getVersion();
        // a secret stores no text for a value that was left out
        if (variable.getValue() == null) {
            return GlobalVariableSnapshot.Entry.ofSecret(name, version, NullNode.getInstance(), openToAll);
        }

        String plainText;
        try {
            plainText = cipher.decrypt(variable.getValue());
        } catch (WrongDecryptException e) {
            return unreadable(name, version, openToAll, e.getMessage());
        }

        try {
            return GlobalVariableSnapshot.Entry.ofSecret(name, version, objectMapper.readTree(plainText), openToAll);
        } catch (JsonProcessingException e) {
            // the parser quotes the text it fails on, so its message stays out
            return unreadable(name, version, openToAll, "the decrypted value is not valid JSON");
        }
    }

    private static GlobalVariableSnapshot.Entry unreadable(String name, long version, boolean openToAll, String reason) {
        log.warn("Secret global variable '{}' cannot be decrypted: {}", name, reason);

        return GlobalVariableSnapshot.Entry.ofUnreadableSecret(name, version, openToAll, reason);
    }

    private JsonNode parse(GlobalVariable variable) {
        if (variable.getValue() == null) {
            return NullNode.getInstance();
        }

        try {
            return objectMapper.readTree(variable.getValue());
        } catch (JsonProcessingException e) {
            // writes only ever store serialized JSON, so the row was changed outside the API
            throw new IllegalStateException(
                    "The stored value of global variable '%s' is not valid JSON".formatted(variable.getName()), e);
        }
    }
}

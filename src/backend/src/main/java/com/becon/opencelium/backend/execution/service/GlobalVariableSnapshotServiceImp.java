package com.becon.opencelium.backend.execution.service;

import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.database.mysql.repository.ConnectionRepository;
import com.becon.opencelium.backend.database.mysql.repository.GlobalVariableRepository;
import com.becon.opencelium.backend.database.mysql.service.GlobalVariableScopeResolver;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableKind;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableScopeType;
import com.becon.opencelium.backend.exception.WrongDecryptException;
import com.becon.opencelium.backend.execution.globalvariable.GlobalScript;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableSnapshot;
import com.becon.opencelium.backend.execution.globalvariable.TestRunOrigins;
import com.becon.opencelium.backend.utility.crypto.GlobalVariableCipher;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.NullNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Takes snapshots of global variables.
 *
 * <p>The value of a secret is decrypted here, into the snapshot only: the entity keeps the
 * encrypted text, so nothing decrypted is ever written back. A secret that cannot be decrypted
 * still gets its entry, which fails where the run reads it, so a run that does not use it goes
 * on.
 *
 * <p>The definition of a script variable is parsed once per id and version and kept for the
 * runs after: a saved change gives the script a new version, and a variable made again under an
 * old name a new id, so a kept definition is never stale. The oldest unused ones are dropped
 * beyond {@value #MAX_PARSED_SCRIPTS}.
 */
@Service
public class GlobalVariableSnapshotServiceImp implements GlobalVariableSnapshotService {

    // a script variable is taken as its definition, which a run calls and never reads as a value
    private static final Set<GlobalVariableKind> ALL_KINDS = EnumSet.allOf(GlobalVariableKind.class);

    private static final Logger log = LoggerFactory.getLogger(GlobalVariableSnapshotServiceImp.class);

    // how many parsed script definitions are kept; each holds the code of a script, at most
    // opencelium.global-variable.max-script-bytes
    static final int MAX_PARSED_SCRIPTS = 256;

    private final GlobalVariableRepository globalVariableRepository;
    private final ConnectionRepository connectionRepository;
    private final GlobalVariableScopeResolver scopeResolver;
    private final ObjectMapper objectMapper;
    private final GlobalVariableCipher cipher;
    private final TestRunOrigins testRunOrigins;
    private final Map<ScriptVersion, ParsedScript> parsedScripts = Collections.synchronizedMap(
            new LinkedHashMap<>(16, 0.75f, true) {
                @Override
                protected boolean removeEldestEntry(Map.Entry<ScriptVersion, ParsedScript> eldest) {
                    return size() > MAX_PARSED_SCRIPTS;
                }
            });

    /** A version of a script variable. */
    private record ScriptVersion(long id, long version) {
    }

    /**
     * A script definition as a snapshot holds it: the JSON tree of its entry, treated as
     * read-only by every run that shares it, and the definition parsed from it.
     */
    private record ParsedScript(JsonNode tree, GlobalScript definition) {
    }

    public GlobalVariableSnapshotServiceImp(
            GlobalVariableRepository globalVariableRepository,
            ConnectionRepository connectionRepository,
            GlobalVariableScopeResolver scopeResolver,
            ObjectMapper objectMapper,
            GlobalVariableCipher cipher,
            TestRunOrigins testRunOrigins) {
        this.globalVariableRepository = globalVariableRepository;
        this.connectionRepository = connectionRepository;
        this.scopeResolver = scopeResolver;
        this.objectMapper = objectMapper;
        this.cipher = cipher;
        this.testRunOrigins = testRunOrigins;
    }

    @Override
    @Transactional(readOnly = true)
    public GlobalVariableSnapshot takeFor(long connectionId) {
        // one query for every variable, however many of them the workflow references
        List<GlobalVariable> variables = globalVariableRepository.findAllWithScopeTargets(ALL_KINDS);
        if (variables.isEmpty()) {
            return GlobalVariableSnapshot.empty();
        }

        Integer categoryId = connectionRepository.findById(connectionId)
                .map(Connection::getCategoryId)
                .orElse(null);
        Set<Long> categoryIds = scopeResolver.categoryChainOf(categoryId);
        // the copy of a test run reads what the workflow it was made from may read: a variable
        // scoped to chosen workflows lists that workflow, not the copy
        long scopeWorkflowId = testRunOrigins.scopeWorkflowOf(connectionId);

        return snapshotOf(variables.stream()
                .filter(variable -> variable.isInScopeOf(scopeWorkflowId, categoryIds))
                .toList());
    }

    @Override
    @Transactional(readOnly = true)
    public GlobalVariableSnapshot takeOpenToAll() {
        return snapshotOf(globalVariableRepository.findAllWithScopeTargets(ALL_KINDS).stream()
                .filter(variable -> variable.getScopeType() == GlobalVariableScopeType.ALL)
                .toList());
    }

    @Override
    public GlobalVariableSnapshot takeOf(Collection<GlobalVariable> variables) {
        return snapshotOf(variables);
    }

    /** Takes the given variables, each script with its parsed definition. */
    private GlobalVariableSnapshot snapshotOf(Collection<GlobalVariable> variables) {
        List<GlobalVariableSnapshot.Entry> entries = new ArrayList<>(variables.size());
        Map<String, GlobalScript> scripts = new HashMap<>();
        for (GlobalVariable variable : variables) {
            // a script is never a secret, so a secret is taken as one whatever its kind says
            if (variable.getKind() == GlobalVariableKind.SCRIPT && !variable.isSecret()) {
                ParsedScript parsed = parsedScript(variable);
                entries.add(GlobalVariableSnapshot.Entry.ofScript(variable.getName(), variable.getVersion(),
                        parsed.tree(), variable.getScopeType() == GlobalVariableScopeType.ALL));
                scripts.put(variable.getName(), parsed.definition());
            } else {
                entries.add(toEntry(variable));
            }
        }

        return GlobalVariableSnapshot.of(entries, scripts);
    }

    /**
     * Returns the parsed definition of a script variable, parsing it only if this version of it
     * was not parsed before.
     *
     * @throws IllegalStateException if the stored definition is not valid
     */
    private ParsedScript parsedScript(GlobalVariable variable) {
        if (variable.getId() == null) {
            // a variable that is not saved has no version to keep its definition under
            return parseScript(variable);
        }

        return parsedScripts.computeIfAbsent(new ScriptVersion(variable.getId(), variable.getVersion()),
                key -> parseScript(variable));
    }

    private ParsedScript parseScript(GlobalVariable variable) {
        return new ParsedScript(parse(variable), GlobalScript.fromJson(variable.getValue()));
    }

    private GlobalVariableSnapshot.Entry toEntry(GlobalVariable variable) {
        boolean openToAll = variable.getScopeType() == GlobalVariableScopeType.ALL;
        if (variable.isSecret()) {
            return toSecretEntry(variable, openToAll);
        }
        if (variable.getKind() == GlobalVariableKind.MUTABLE) {
            return GlobalVariableSnapshot.Entry.ofMutable(
                    variable.getName(), variable.getVersion(), parse(variable), openToAll);
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

    // a mutable variable gives the current value it has as the run starts; a run then reads it
    // live at each step, see ExecutionManagerImpl#getGlobalValue
    private JsonNode parse(GlobalVariable variable) {
        String text = variable.getReadableValue();
        if (text == null) {
            return NullNode.getInstance();
        }

        try {
            return objectMapper.readTree(text);
        } catch (JsonProcessingException e) {
            // writes only ever store serialized JSON, so the row was changed outside the API
            throw new IllegalStateException(
                    "The stored value of global variable '%s' is not valid JSON".formatted(variable.getName()), e);
        }
    }
}

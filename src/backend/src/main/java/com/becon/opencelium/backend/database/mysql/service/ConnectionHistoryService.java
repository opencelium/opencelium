package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.ConnectionHistory;
import com.becon.opencelium.backend.enums.Action;
import com.github.fge.jsonpatch.JsonPatch;

public interface ConnectionHistoryService {
    ConnectionHistory makeHistoryAndSave(Connection connection, JsonPatch jsonPatch, Action action);

    ConnectionHistory makeHistoryAndSave(Long connectionId, JsonPatch jsonPatch, Action action);
}

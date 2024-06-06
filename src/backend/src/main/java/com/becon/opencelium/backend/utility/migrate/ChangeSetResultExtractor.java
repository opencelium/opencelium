package com.becon.opencelium.backend.utility.migrate;

import org.springframework.jdbc.core.ResultSetExtractor;

import java.sql.ResultSet;
import java.sql.SQLException;

public class ChangeSetResultExtractor implements ResultSetExtractor<ChangeSet> {

    @Override
    public ChangeSet extractData(ResultSet rs) throws SQLException {
        ChangeSet cs = new ChangeSet();
        cs.setId(rs.getInt("id"));
        cs.setOperation(rs.getString("op"));
        cs.setPath(rs.getString("path"));
        cs.setValue(rs.getString("value"));
        cs.setVersion(rs.getString("version"));
        cs.setTimestamp(rs.getLong("timestamp"));
        cs.setSuccess(rs.getInt("success") == 1);
        return cs;
    }

}
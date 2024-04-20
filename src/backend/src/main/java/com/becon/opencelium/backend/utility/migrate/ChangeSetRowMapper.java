package com.becon.opencelium.backend.utility.migrate;

import org.springframework.jdbc.core.RowMapper;

import java.sql.ResultSet;
import java.sql.SQLException;

public class ChangeSetRowMapper implements RowMapper<ChangeSet> {

    @Override
    public ChangeSet mapRow(ResultSet rs, int line) throws SQLException {
        ChangeSetResultExtractor extractor = new ChangeSetResultExtractor();
        return extractor.extractData(rs);
    }

}

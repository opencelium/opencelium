package com.becon.opencelium.backend.utility.migrate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;
import java.util.List;

public class ChangeSetDao {
    private static final Logger log = LoggerFactory.getLogger(ChangeSetDao.class);
    private final JdbcTemplate template;

    public ChangeSetDao(DataSource dataSource) {
        this.template = new JdbcTemplate(dataSource);
    }

    public ChangeSetDao(JdbcTemplate template) {
        this.template = template;
    }

    public void create(ChangeSet changeSet) {
        template.update("INSERT INTO change_set_yml (version, path, op, timestamp, success, value) VALUES(?,?,?,?,?,?)",
                changeSet.getVersion(), changeSet.getPath(), changeSet.getOperation(), System.currentTimeMillis(), changeSet.isSuccess(), changeSet.getValue());
    }

    public ChangeSet get(int id) {
        List<ChangeSet> list = template.query("select * from change_set_yml where id = ? limit 1",
                new Object[]{id},
                new ChangeSetRowMapper());
        if (list.isEmpty()) {
            return null;
        } else {
            return list.get(0);
        }
    }

    public ChangeSet getLast() {
        List<ChangeSet> list = template.query("select * from change_set_yml where success ORDER BY timestamp DESC limit 1",
                new ChangeSetRowMapper());
        if (list.isEmpty()) {
            return null;
        } else {
            return list.get(0);
        }
    }

    public void createAll(List<ChangeSet> list) {
        if (list == null || list.isEmpty()) {
            return;
        }
        for (ChangeSet changeSet : list) {
            create(changeSet);
            if (changeSet.isSuccess()) {
                log.info("YAML changelog: {} successfully applied", changeSet.getVersion());
            } else {
                log.warn("YAML changelog: {} is ignored", changeSet.getVersion());
            }
        }
    }
}

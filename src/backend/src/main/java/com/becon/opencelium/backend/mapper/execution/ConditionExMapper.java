package com.becon.opencelium.backend.mapper.execution;

import com.becon.opencelium.backend.database.mongodb.entity.ConditionMng;
import com.becon.opencelium.backend.database.mongodb.entity.StatementMng;
import com.becon.opencelium.backend.enums.RelationalOperator;
import com.becon.opencelium.backend.resource.execution.ConditionEx;
import org.springframework.stereotype.Component;

@Component
public class ConditionExMapper {
    public ConditionEx toEntity(ConditionMng dto) {
        ConditionEx condition = new ConditionEx();
        RelationalOperator ro = RelationalOperator.fromName(dto.getRelationalOperator());
        StatementMng ls = dto.getLeftStatement();
        StatementMng rs = dto.getRightStatement();
        switch (ro) {
            case CONTAINS, NOTCONTAINS: {
                condition.setLeft(ls.getColor() + ".(" + ls.getType() + ")." + ls.getField() + "." + rs.getRightPropertyValue());
                condition.setRight(rs.getColor() + ".(" + rs.getType() + ")." + rs.getField());
            }
            case EQUALTO, GREATERTHAN, GREATERTHANOREQUALTO, LESSTHAN, LESSTHANOREQUALTO, LIKE, MATCHES, MATCHESINLIST, NOTLIKE, REGEX:{
                condition.setLeft(ls.getColor() + ".(" + ls.getType() + ")." + ls.getField());
                condition.setRight(rs.getColor() + ".(" + rs.getType() + ")." + rs.getField());
            }
            case PROPERTYNOTEXISTS, PROPERTYEXISTS, ISTYPEOF:{
                //TODO: ???
            }
            case ISEMPTY, ISNOTEMPTY, ISNOTNULL, ISNULL:{
                condition.setLeft(ls.getColor() + ".(" + ls.getType() + ")." + ls.getField());
            }
        }
        condition.setRelationalOperator(dto.getRelationalOperator());
        return condition;
    }
}

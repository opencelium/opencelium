package com.becon.opencelium.backend.resource.notification.tool.teams;

import com.becon.opencelium.backend.enums.SectionType;

import java.util.List;

public class TeamsDto {

    private SectionType type;
    private List<SectionValue> value;

    public SectionType getType() {
        return type;
    }

    public void setType(SectionType type) {
        this.type = type;
    }

    public List<SectionValue> getValue() {
        return value;
    }

    public void setValue(List<SectionValue> value) {
        this.value = value;
    }
}

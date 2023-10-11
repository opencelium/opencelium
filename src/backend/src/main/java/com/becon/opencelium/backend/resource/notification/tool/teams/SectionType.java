package com.becon.opencelium.backend.resource.notification.tool.teams;

public enum SectionType {
    CHANNEL("channel"), TEAM("team");

    private String interactiveSpaces;

    SectionType(String interactiveSpaces) {
        this.interactiveSpaces = interactiveSpaces;
    }

    @Override
    public String toString() {
        return interactiveSpaces;
    }
}

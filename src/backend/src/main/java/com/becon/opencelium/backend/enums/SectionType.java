package com.becon.opencelium.backend.enums;

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

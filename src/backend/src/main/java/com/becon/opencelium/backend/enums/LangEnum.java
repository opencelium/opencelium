package com.becon.opencelium.backend.enums;

public enum LangEnum {
    EN("English", "en"), DE("German" ,"de");

    private final String name;
    private final String code;
    LangEnum(String name, String code) {
        this.name = name;
        this.code = code;
    }

    public boolean equalsByCode(String code) {
        return this.code.equals(code);
    }

    public boolean equalsByName(String name) {
        return this.name.equals(name);
    }

    public String getName() {
        return name;
    }

    public String getCode() {
        return code;
    }

    @Override
    public String toString() {
        return code;
    }
}

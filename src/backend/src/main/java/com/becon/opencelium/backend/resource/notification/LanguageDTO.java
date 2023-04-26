package com.becon.opencelium.backend.resource.notification;

public class LanguageDTO {
    private String name;
    private String code;

    public LanguageDTO() {
    }

    public LanguageDTO(String name, String code) {
        this.name = name;
        this.code = code;
    }



    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}

package com.becon.opencelium.backend.resource.execution;

import java.util.Map;

public class EnhancementDTO {
    private String enhanceId;
    private String script;
    private Map<String, String> args;
    private String lang;

    public String getEnhanceId() {
        return enhanceId;
    }

    public void setEnhanceId(String enhanceId) {
        this.enhanceId = enhanceId;
    }

    public String getScript() {
        return script;
    }

    public void setScript(String script) {
        this.script = script;
    }

    public Map<String, String> getArgs() {
        return args;
    }

    public void setArgs(Map<String, String> args) {
        this.args = args;
    }

    public String getLang() {
        return lang;
    }

    public void setLang(String lang) {
        this.lang = lang;
    }
}

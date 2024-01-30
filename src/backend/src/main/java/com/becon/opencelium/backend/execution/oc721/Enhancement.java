package com.becon.opencelium.backend.execution.oc721;

import com.becon.opencelium.backend.resource.execution.EnhancementEx;

import java.util.Map;

public class Enhancement {
    private Integer enhanceId;
    private String script;
    private Map<String, String> args;
    private String lang;

    public static Enhancement fromEx(EnhancementEx enhancementEx) {
        Enhancement result = new Enhancement();

        result.setEnhanceId(enhancementEx.getEnhanceId());
        result.setScript(enhancementEx.getScript());
        result.setArgs(enhancementEx.getArgs());
        result.setLang(enhancementEx.getLang());

        return result;
    }

    public Integer getEnhanceId() {
        return enhanceId;
    }

    public void setEnhanceId(Integer enhanceId) {
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

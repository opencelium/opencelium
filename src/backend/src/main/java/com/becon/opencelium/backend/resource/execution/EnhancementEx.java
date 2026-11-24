package com.becon.opencelium.backend.resource.execution;

import java.util.Map;

public class EnhancementEx {
    private Integer enhanceId;
    private String script;
    private Map<String, String> args;
    private String lang;
    // the field the enhancement fills, its RESULT_VAR reference; names it in an error
    private String resultRef;

    public EnhancementEx() {
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

    public String getResultRef() {
        return resultRef;
    }

    public void setResultRef(String resultRef) {
        this.resultRef = resultRef;
    }
}

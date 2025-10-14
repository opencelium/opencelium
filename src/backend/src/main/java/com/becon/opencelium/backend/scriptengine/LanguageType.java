package com.becon.opencelium.backend.scriptengine;

import java.util.Objects;

import static com.becon.opencelium.backend.scriptengine.ScriptEngineType.*;

public enum LanguageType {
    JS("js", "JavaScript", NASHORN),
    PYTHON_2("python2", "Python 2", POLYGOT_ENGINE),
    PYTHON_3("python3", "Python 3", POLYGOT_ENGINE),
    RUBY("ruby", "Ruby", POLYGOT_ENGINE),
    ;

    private final String code;
    private final String name;
    private final ScriptEngineType defaultEngine;

    LanguageType(String code, String name, ScriptEngineType defaultEngine) {
        this.code = code;
        this.name = name;
        this.defaultEngine = defaultEngine;
    }


    public static LanguageType getByCode(String code) {
        for (LanguageType type : values()) {
            if(Objects.equals(code, type.getCode())) {
                return type;
            }
        }

        throw new RuntimeException("%s language is not supported");
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public ScriptEngineType getDefaultEngine() {
        return defaultEngine;
    }
}

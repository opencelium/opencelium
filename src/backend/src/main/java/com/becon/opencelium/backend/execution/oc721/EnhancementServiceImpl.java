package com.becon.opencelium.backend.execution.oc721;

import com.becon.opencelium.backend.execution.ExecutionManager;
import com.becon.opencelium.backend.resource.execution.EnhancementDTO;

import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;
import java.util.Map;

public class EnhancementServiceImpl implements EnhancementService {
    private ExecutionManager executionManager;

    @Override
    public Object executeScript(String bindId) {

        // TODO where to get the required script?
        EnhancementDTO enhancement = new EnhancementDTO();

        ScriptEngineManager manager = new ScriptEngineManager();
        ScriptEngine engine = manager.getEngineByName("nashorn");

        // TODO convert (from ref) and the add all necessary args
        Map<String, String> args = enhancement.getArgs();
//        engine.put(VAR_NAME, value);

        String function = "(function() {" + enhancement.getScript() + "})";

        try {
            return engine.eval(function);
        } catch (ScriptException e) {
            throw new RuntimeException(e);
        }
    }
}

package com.becon.opencelium.backend.execution.oc721;

import com.becon.opencelium.backend.execution.ExecutionManager;

import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;

public class EnhancementServiceImpl implements EnhancementService {
    private final ExecutionManager executionManager;

    public EnhancementServiceImpl(ExecutionManager executionManager) {
        this.executionManager = executionManager;
    }

    @Override
    public Object execute(Enhancement enhancement) {
        ScriptEngineManager manager = new ScriptEngineManager();
        ScriptEngine engine = manager.getEngineByName("nashorn");

        // resolve all references and add them to engine
        enhancement.getArgs().forEach((varName, ref) -> {
            Object value = executionManager.getValue(ref);

            engine.put(varName, value);
        });

        try {
            return engine.eval(enhancement.getScript());
        } catch (ScriptException e) {
            throw new RuntimeException(e);
        }
    }
}

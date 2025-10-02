//package com.becon.opencelium.backend.scriptengine.engines;
//
//import com.becon.opencelium.backend.scriptengine.*;
//import com.becon.opencelium.backend.scriptengine.Language;
//import com.becon.opencelium.backend.scriptengine.ex.InvalidScriptException;
//import com.becon.opencelium.backend.scriptengine.ex.ScriptExecutionException;
//import com.fasterxml.jackson.core.JsonProcessingException;
//import com.fasterxml.jackson.core.type.TypeReference;
//import com.fasterxml.jackson.databind.ObjectMapper;
//import org.graalvm.polyglot.*;
//import org.springframework.stereotype.Component;
//
//import java.util.*;
//import java.util.function.Function;
//import java.util.stream.Collectors;
//
//@Component
//public class GraalRubyEngine implements ScriptEngine {
//
//    private final ObjectMapper mapper = new ObjectMapper();
//
//    @Override
//    public boolean supports(Language lang) {
//        return lang != null
//                && lang.getLanguage() == LanguageType.RUBY
//                && lang.getEngine() == ScriptEngineType.GRAALVM;
//    }
//
//    @Override
//    public Object execute(String script) throws ScriptExecutionException, InvalidScriptException {
//        return execute(script, null);
//    }
//
//    @Override
//    public Object execute(String script, Map<String, Object> bindings) throws ScriptExecutionException, InvalidScriptException {
//        try (Context context = newContext()) {
//            bindArgs(context, bindings);
//            Value result = context.eval("ruby", script);
//            return translateResult(context, result);
//        } catch (PolyglotException e) {
//            if (e.isSyntaxError()) {
//                throw new InvalidScriptException(e.getMessage(), e);
//            }
//            throw new ScriptExecutionException(e.getMessage(), e);
//        } catch (Exception e) {
//            throw new ScriptExecutionException("Unknown error: " + e.getMessage(), e);
//        }
//    }
//
//    @Override
//    public Object execute(String script, Map<String, String> bindings, Function<String, Object> referenceExtractor)
//            throws ScriptExecutionException, InvalidScriptException {
//        try (Context context = newContext()) {
//            Map<String, Object> resolved = bindings.entrySet().stream()
//                    .collect(Collectors.toMap(Map.Entry::getKey, e -> referenceExtractor.apply(e.getValue())));
//            bindArgs(context, resolved);
//            Value result = context.eval("ruby", script);
//            return translateResult(context, result);
//        } catch (PolyglotException e) {
//            if (e.isSyntaxError()) {
//                throw new InvalidScriptException(e.getMessage(), e);
//            }
//            throw new ScriptExecutionException(e.getMessage(), e);
//        } catch (Exception e) {
//            throw new ScriptExecutionException("Unknown error: " + e.getMessage(), e);
//        }
//    }
//
//    @Override
//    public void validate(String script) throws InvalidScriptException {
//        try (Context context = newContext()) {
//            context.parse("ruby", script);
//        } catch (PolyglotException e) {
//            if (e.isSyntaxError()) {
//                throw new InvalidScriptException(e.getMessage(), e);
//            }
//            throw new InvalidScriptException("Invalid script: " + script, e);
//        }
//    }
//
//    @Override
//    public boolean isUp() {
//        EngineHealthChecker healthChecker = EngineHealthCheckerFactory.getHealthChecker(ScriptEngineType.GRAALVM);
//
//        if (healthChecker != null && healthChecker.check()) {
//            try (Context context = Context.create()) {
//                return context.getEngine().getLanguages().keySet().stream().anyMatch("ruby"::equals);
//            }
//        }
//        return false;
//    }
//
//    private Context newContext() {
//        return Context.newBuilder("ruby")
//                .option("engine.WarnInterpreterOnly", "false")
//                .allowAllAccess(false)
//                .build();
//    }
//
//    private void bindArgs(Context context, Map<String, Object> bindings) {
//        if (bindings == null || bindings.isEmpty()) return;
//        Value rubyBindings = context.getBindings("ruby");
//        bindings.forEach((name, val) -> {
//            if (val instanceof Map || val instanceof List) {
//                try {
//                    String json = mapper.writeValueAsString(val);
//                    // Ruby JSON parsing: `require 'json'; JSON.parse('<json>')`
//                    Value rubyObj = context.eval("ruby",
//                        "require 'json'\nJSON.parse('" + escapeRubyString(json) + "')");
//                    rubyBindings.putMember(name, rubyObj);
//                } catch (JsonProcessingException e) {
//                    throw new ScriptExecutionException("Error serializing binding: " + name, e);
//                }
//            } else {
//                rubyBindings.putMember(name, val);
//            }
//        });
//    }
//
//    private Object translateResult(Context context, Value result) {
//        if (result == null || result.isNull()) return null;
//        if (result.isBoolean()) return result.asBoolean();
//        if (result.isNumber()) return result.as(Number.class);
//        if (result.isString()) return result.asString();
//
//        try {
//            // Use Ruby's JSON to dump objects as string, then parse back into Java collections
//            Value json = context.eval("ruby", "require 'json'\nJSON");
//            String dumped = json.invokeMember("generate", result).asString();
//
//            if (dumped.trim().startsWith("[")) {
//                return mapper.readValue(dumped, List.class);
//            } else {
//                return mapper.readValue(dumped, new TypeReference<Map<String, Object>>() {});
//            }
//        } catch (PolyglotException | JsonProcessingException e) {
//            throw new ScriptExecutionException("Cannot convert Ruby result", e);
//        }
//    }
//
//    private String escapeRubyString(String s) {
//        if (s == null) return "";
//        return s.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("\r", "\\r");
//    }
//}

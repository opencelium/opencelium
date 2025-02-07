
package com.becon.opencelium.backend.version_manager.backup;

import com.becon.opencelium.backend.version_manager.Wrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.lang3.StringUtils;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Objects;

@Aspect
@Component
public class BackupAspect {

    private final ObjectMapper objectMapper;
    private final BackupManager backupManager;

    public BackupAspect(ObjectMapper objectMapper, BackupManager backupManager) {
        this.objectMapper = objectMapper;
        this.backupManager = backupManager;
    }

    @Around("@annotation(backup)")
    public Object handleBackup(ProceedingJoinPoint joinPoint, Backup backup) throws Throwable {
        Object targetObj = null;
        if (!backup.value().isEmpty()) {
            // Get the method and parameter names
            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            String[] parameterNames = signature.getParameterNames();
            Object[] args = joinPoint.getArgs();

            for (int i = 0; i < parameterNames.length; i++) {
                if (StringUtils.equals(parameterNames[i], backup.value())) {
                    targetObj = args[i];
                    break;
                }
            }
        } else {
            if (joinPoint.getArgs().length == 0) {
                return joinPoint.proceed();
            }
            targetObj = joinPoint.getArgs()[0];
        }

        if (Objects.isNull(targetObj))
            return joinPoint.proceed();

        Object serializedObj;
        try {
            serializedObj = objectMapper.convertValue(targetObj, Map.class);
        } catch (Exception e) {
            try {
                serializedObj = objectMapper.writeValueAsString(targetObj);
            } catch (JsonProcessingException ex) {
                return joinPoint.proceed();
            }
        }

        Object result = joinPoint.proceed();

        if (!(result instanceof Wrapper<?> wrapped))
            return result;

        if (!wrapped.isChanged() || Objects.isNull(wrapped.getData()))
            return result;

        backupManager.doBackup(serializedObj, targetObj.getClass(), wrapped.getOldVersion(), wrapped.getNewVersion());

        return result;
    }
}


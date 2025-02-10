package com.becon.opencelium.backend.version_manager.base;

import com.becon.opencelium.backend.version_manager.Wrapper;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Aspect
@Component
public class SuspendExceptionProcessor {

    private static final Logger log = LoggerFactory.getLogger(SuspendExceptionProcessor.class);

    @Around("@annotation(com.becon.opencelium.backend.version_manager.base.SuspendException)")
    public Object wrapResponse(ProceedingJoinPoint point) {
        try {
            return point.proceed();
        } catch (Throwable e) {
            Object data = point.getArgs()[0];
            log.warn("Could not update an entity '{}'", data.getClass().getSimpleName());
            log.warn(Arrays.toString(e.getStackTrace()));
            return Wrapper.notUpdated(point.getArgs()[0]);
        }
    }
}

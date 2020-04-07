package com.becon.opencelium.backend.aspect;

import com.becon.opencelium.backend.mysql.entity.Activity;
import com.becon.opencelium.backend.resource.connection.MethodResource;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;

import java.util.Date;

@Aspect
@Component
public class ValidationAspect {

//    @Before(value = "execution(* com.becon.opencelium.backend.utility.ActionUtility.buildMethodEntity(..))")
//    public void beforeAdviseMethod(JoinPoint joinPoint){
////        System.out.println(joinPoint.getKind());
//        System.out.println("Hello aspect2");
//    }
}

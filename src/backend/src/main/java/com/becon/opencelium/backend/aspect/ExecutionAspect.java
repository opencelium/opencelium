/*
 * // Copyright (C) <2020> <becon GmbH>
 * //
 * // This program is free software: you can redistribute it and/or modify
 * // it under the terms of the GNU General Public License as published by
 * // the Free Software Foundation, version 3 of the License.
 * //
 * // This program is distributed in the hope that it will be useful,
 * // but WITHOUT ANY WARRANTY; without even the implied warranty of
 * // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * // GNU General Public License for more details.
 * //
 * // You should have received a copy of the GNU General Public License
 * // along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

package com.becon.opencelium.backend.aspect;


import com.becon.opencelium.backend.mysql.entity.Activity;
import com.becon.opencelium.backend.neo4j.entity.BodyNode;
import com.becon.opencelium.backend.quartz.JobExecutor;
import org.aopalliance.intercept.Joinpoint;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.*;
import org.quartz.JobExecutionContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Date;

@Aspect
@Component
public class ExecutionAspect {

    private static final Logger logger = LoggerFactory.getLogger(JobExecutor.class);

    @Before("execution(* com.becon.opencelium.backend.quartz.JobExecutor.executeInternal(..)) && args(context)")
    public void sendBefore(JobExecutionContext context){
         System.out.println("-------------------------- Hello from aspect Before ----------------------------");

        logger.info("Executing Job with key {}", context.getJobDetail().getKey());
        logger.info("Firing  Trigger with key {}", context.getTrigger().getKey());
    }

    @After("execution(* com.becon.opencelium.backend.quartz.JobExecutor.executeInternal(..)) && args(context)")
    public void sendAfter(JobExecutionContext context){
        System.out.println("-------------------------- Hello from aspect After ----------------------------");

        logger.info("Executing Job with key {}", context.getJobDetail().getKey());
        logger.info("Firing  Trigger with key {}", context.getTrigger().getKey());
    }

    @AfterThrowing(pointcut = "execution(* com.becon.opencelium.backend.quartz.JobExecutor.executeInternal(..)) && args(context)",
                   throwing="ex")
    public void sendAlert(JobExecutionContext context, Exception ex){
        System.out.println("-------------------------- Hello from aspect Exeption ----------------------------");

        logger.info("Executing Job with key {}", context.getJobDetail().getKey());
        logger.info("Firing  Trigger with key {}", context.getTrigger().getKey());
    }
}

/*
 * // Copyright (C) <2019> <becon GmbH>
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
import org.aopalliance.intercept.Joinpoint;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.*;
import org.quartz.JobExecutionContext;
import org.springframework.stereotype.Component;

import java.util.Date;

@Aspect
@Component
public class ExecutionAspect {
//    @Before("execution(private * com.becon.opencelium.backend.execution.ConnectorExecutor.buildBody(..))")
//    public void massageLog(Joinpoint joinpoint){
//         System.out.println("-------------------------- Hello from aspect ----------------------------");
//    }
}

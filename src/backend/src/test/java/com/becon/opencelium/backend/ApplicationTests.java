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

package com.becon.opencelium.backend;

import com.becon.opencelium.backend.mysql.entity.Execution;
import com.becon.opencelium.backend.mysql.entity.Scheduler;
import com.becon.opencelium.backend.mysql.service.ConnectionServiceImp;
import com.becon.opencelium.backend.mysql.service.ExecutionServiceImp;
import com.becon.opencelium.backend.mysql.service.SchedulerServiceImp;
import com.becon.opencelium.backend.neo4j.entity.ConnectionNode;
import com.becon.opencelium.backend.neo4j.service.ConnectionNodeServiceImp;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;

@SpringBootTest
public class ApplicationTests {

	@Autowired
	private ExecutionServiceImp executionServiceImp;

	@Autowired
	private SchedulerServiceImp schedulerServiceImp;

	@Test
	public void contextLoads() {
//		Execution execution = executionServiceImp.findById(5).get();
//		System.out.println(execution);

//		try	{
//			ConnectionNode connectionNode = connectionNodeServiceImp.findByConnectionId(48L).get();
//			System.out.println(connectionNode);
//		} catch (Exception e) {
//			e.printStackTrace();
//		}
	}
}

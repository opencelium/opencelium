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

import com.becon.opencelium.backend.constant.RegExpression;
import com.becon.opencelium.backend.execution.MessageContainer;
import com.becon.opencelium.backend.utility.ConditionUtility;
import com.jayway.jsonpath.JsonPath;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;


@RunWith(SpringRunner.class)
@SpringBootTest
public class ApplicationTests {

	@Test
	public void contextLoads() {
		String response = "";
		HashMap<Integer, String> data = new HashMap<>();
		List<String> loopingArrays = new ArrayList<>();
		Map<String, Integer> loopIndex = new HashMap<>();
		MessageContainer messageContainer = new MessageContainer();

		data.put(0, getResponse());
		loopingArrays.add("#FFCCBB.response.success.[*]");
		loopIndex.put("#FFCCBB.response.success.[*]", 3);

		messageContainer.setData(data);
		messageContainer.setLoopingArrays(loopingArrays);

		Object result = messageContainer.getValue("#FFCCBB.(response).success.[i].name", loopIndex);

		System.out.println(result.toString());
	}


	private String getResponse() {
		return "[\n" +
				"  {\n" +
				"    \"id\": \"5ac5ddf8cc331eceb4d6c7d7\",\n" +
				"    \"name\": \"Backlog\",\n" +
				"    \"closed\": false,\n" +
				"    \"pos\": 16384,\n" +
				"    \"softLimit\": null,\n" +
				"    \"idBoard\": \"5ac5ddf758c80617aec33425\",\n" +
				"    \"subscribed\": false\n" +
				"  },\n" +
				"  {\n" +
				"    \"id\": \"5ac5ddf80b2f2ddb4f89e83c\",\n" +
				"    \"name\": \"[Ruz] Selected for development\",\n" +
				"    \"closed\": false,\n" +
				"    \"pos\": 40960,\n" +
				"    \"softLimit\": null,\n" +
				"    \"idBoard\": \"5ac5ddf758c80617aec33425\",\n" +
				"    \"subscribed\": false\n" +
				"  },\n" +
				"  {\n" +
				"    \"id\": \"5ac5ddf8531622edce4e1701\",\n" +
				"    \"name\": \"[Bob] Selected for development\",\n" +
				"    \"closed\": false,\n" +
				"    \"pos\": 45056,\n" +
				"    \"softLimit\": null,\n" +
				"    \"idBoard\": \"5ac5ddf758c80617aec33425\",\n" +
				"    \"subscribed\": false\n" +
				"  },\n" +
				"  {\n" +
				"    \"id\": \"5e78cc7edf824c46fe5d7d0d\",\n" +
				"    \"name\": \"[Hojik] Selected for development\",\n" +
				"    \"closed\": false,\n" +
				"    \"pos\": 47104,\n" +
				"    \"softLimit\": null,\n" +
				"    \"idBoard\": \"5ac5ddf758c80617aec33425\",\n" +
				"    \"subscribed\": false\n" +
				"  },\n" +
				"  {\n" +
				"    \"id\": \"5ac5ddf877b11a76e4d0627e\",\n" +
				"    \"name\": \"In work\",\n" +
				"    \"closed\": false,\n" +
				"    \"pos\": 49152,\n" +
				"    \"softLimit\": null,\n" +
				"    \"idBoard\": \"5ac5ddf758c80617aec33425\",\n" +
				"    \"subscribed\": false\n" +
				"  },\n" +
				"  {\n" +
				"    \"id\": \"5ac5ddf814cda4d103f1b7a6\",\n" +
				"    \"name\": \"Test\",\n" +
				"    \"closed\": false,\n" +
				"    \"pos\": 57344,\n" +
				"    \"softLimit\": null,\n" +
				"    \"idBoard\": \"5ac5ddf758c80617aec33425\",\n" +
				"    \"subscribed\": false\n" +
				"  },\n" +
				"  {\n" +
				"    \"id\": \"5ac5ddf8518f7d173f359570\",\n" +
				"    \"name\": \"Done\",\n" +
				"    \"closed\": false,\n" +
				"    \"pos\": 65536,\n" +
				"    \"softLimit\": null,\n" +
				"    \"idBoard\": \"5ac5ddf758c80617aec33425\",\n" +
				"    \"subscribed\": false\n" +
				"  }\n" +
				"]";
	}
}

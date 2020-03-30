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

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@RunWith(SpringRunner.class)
@SpringBootTest
public class ApplicationTests {

	@Test
	public void contextLoads() {
	}

	@Test
	public void restTest(){

//		HttpMethod method = HttpMethod.GET;
//		String url = "http://oc-sensu.westeurope.cloudapp.azure.com:8080/api/core/v2/namespaces/default/events";
//
//		String token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1ODUzMjU5OTIsImp0aSI6Ijg4ZDMwOTFjYWExZTZlYmFkMjNjMDdlNDY4YjMyOTg5IiwiaXNzIjoiaHR0cDovL29jLXNlbnN1Lndlc3RldXJvcGUuY2xvdWRhcHAuYXp1cmUuY29tOjgwODAiLCJzdWIiOiJhZG1pbiIsImdyb3VwcyI6WyJjbHVzdGVyLWFkbWlucyIsInN5c3RlbTp1c2VycyJdLCJwcm92aWRlciI6eyJwcm92aWRlcl9pZCI6ImJhc2ljIiwicHJvdmlkZXJfdHlwZSI6IiIsInVzZXJfaWQiOiJhZG1pbiJ9LCJhcGlfa2V5IjpmYWxzZX0.H9rP9ilQAekeXRLws1Nf9vYfRIDOF-td1J7tgTCUZS4";
//		HttpHeaders header = new HttpHeaders();
//		Map<String, String> headerItem = new HashMap<>();
//		headerItem.put("Authorization", "Bearer " + token);
//		headerItem.put("Content-Type", "application/json");
//		header.setAll(headerItem);
//
//		String body = null;
//		HttpEntity<Object> httpEntity = new HttpEntity <Object> (body, header);
//		ResponseEntity<String> response = restTemplate.exchange(url, method ,httpEntity, String.class);
//		System.out.println(response);
	}

}

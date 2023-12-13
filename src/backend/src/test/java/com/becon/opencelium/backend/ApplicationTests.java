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

import com.becon.opencelium.backend.configuration.cutomizer.RestCustomizer;
import org.apache.hc.client5.http.auth.AuthScope;
import org.apache.hc.client5.http.auth.CredentialsProvider;
import org.apache.hc.client5.http.auth.UsernamePasswordCredentials;
import org.apache.hc.client5.http.classic.HttpClient;
import org.apache.hc.client5.http.impl.auth.BasicCredentialsProvider;
import org.apache.hc.client5.http.impl.classic.HttpClientBuilder;
import org.apache.hc.client5.http.impl.routing.DefaultProxyRoutePlanner;
import org.apache.hc.core5.http.HttpHost;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@SpringBootTest
public class ApplicationTests {

	@Test
	public void contextLoads() {
//		String proxyHost = "38.154.227.167";
//		int proxyPort = 5868;
//		RestTemplateBuilder restTemplateBuilder = new RestTemplateBuilder();
//		RestTemplate restTemplate = restTemplateBuilder.build();
//		HttpHost proxy = new HttpHost(proxyHost, proxyPort);
//		BasicCredentialsProvider credsProvider = new BasicCredentialsProvider();
//		credsProvider.setCredentials(
//				new AuthScope(proxyHost, proxyPort),
//				new UsernamePasswordCredentials("bocffjov", "tgjzz8pvelfc".toCharArray())
//		);
//		HttpClient httpClient = HttpClientBuilder.create()
//				.setRoutePlanner(new DefaultProxyRoutePlanner(proxy))
//				.setDefaultCredentialsProvider(credsProvider)
//				.build();
//		restTemplate.setRequestFactory(new HttpComponentsClientHttpRequestFactory(httpClient));
//
//		String uri = "https://www.google.com";
//		HttpMethod httpMethod = HttpMethod.GET;
//		HttpHeaders httpHeaders = new HttpHeaders();
//		HttpEntity<Object> httpEntity = new HttpEntity<Object>(httpHeaders);
//		ResponseEntity<String> re = restTemplate.exchange(uri, httpMethod, httpEntity, String.class);
//
//		System.out.println(re.getBody());
	}
}

package com.becon.opencelium.backend.configuration;

import com.becon.opencelium.backend.constant.SecurityConstant;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AppConfiguration {

    @Bean
    public RestTemplate restTemplate() {
        RestTemplate restTemplate = new RestTemplate();
        HttpComponentsClientHttpRequestFactory requestFactory = new HttpComponentsClientHttpRequestFactory();
        requestFactory.setConnectionRequestTimeout(SecurityConstant.CONN_REQ_TIMEOUT);
        requestFactory.setConnectTimeout(SecurityConstant.CONN_TIMEOUT);
        requestFactory.setReadTimeout(SecurityConstant.READ_TIMEOUT);
        restTemplate.setRequestFactory(requestFactory);
        return restTemplate;
    }
}

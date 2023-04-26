package com.becon.opencelium.backend.configuration;

import com.becon.opencelium.backend.constant.SecurityConstant;
import org.springframework.beans.factory.config.YamlPropertiesFactoryBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
public class AppConfiguration {

    @Bean
    public RestTemplate restTemplate() {
        RestTemplateBuilder restTemplateBuilder = new RestTemplateBuilder();
        restTemplateBuilder.setReadTimeout(Duration.ofMillis(SecurityConstant.READ_TIMEOUT));
        RestTemplate restTemplate = restTemplateBuilder.build();
        HttpComponentsClientHttpRequestFactory requestFactory = new HttpComponentsClientHttpRequestFactory();
        requestFactory.setConnectionRequestTimeout(SecurityConstant.CONN_REQ_TIMEOUT);
        requestFactory.setConnectTimeout(SecurityConstant.CONN_TIMEOUT);
        restTemplate.setRequestFactory(requestFactory);
        return restTemplate;
    }

    @Bean
    public YamlPropertiesFactoryBean getYamlProps() {
        YamlPropertiesFactoryBean yamlFactory = new YamlPropertiesFactoryBean();
        yamlFactory.setResources(new ClassPathResource("application.yml"));
        return yamlFactory;
    }
}

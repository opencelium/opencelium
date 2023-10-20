package com.becon.opencelium.backend.configuration;

import com.becon.opencelium.backend.configuration.cutomizer.RestCustomizer;
import com.becon.opencelium.backend.constant.SecurityConstant;
import com.becon.opencelium.backend.constant.YamlPropConst;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClientBuilder;
import org.apache.hc.core5.http.HttpHost;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.YamlPropertiesFactoryBean;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.io.ClassPathResource;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
public class AppConfiguration {

    @Autowired
    private Environment env;

    @Bean
    public RestTemplate restTemplate() {
        RestTemplateBuilder restTemplateBuilder = new RestTemplateBuilder(new RestCustomizer());
        return restTemplateBuilder
                .setReadTimeout(Duration.ofMillis(SecurityConstant.READ_TIMEOUT)).build();
    }

    @Bean
    public YamlPropertiesFactoryBean getYamlProps() {
        YamlPropertiesFactoryBean yamlFactory = new YamlPropertiesFactoryBean();
        yamlFactory.setResources(new ClassPathResource("application.yml"));
        return yamlFactory;
    }

    private CloseableHttpClient buildHttpClient() {
        HttpHost proxy = new HttpHost("PROXY_SERVER_HOST", "PROXY_SERVER_PORT");
        return HttpClientBuilder.create().setProxy(proxy).build();
    }
}

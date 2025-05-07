package com.becon.opencelium.backend.configuration;

import com.becon.opencelium.backend.configuration.interceptors.UserInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurationSupport;

import java.util.List;

@Configuration
public class RegisterInterceptorsConfig extends WebMvcConfigurationSupport {

    private static final List<String> USER_INTERCEPT_PATHS = List.of("/**");

    private final UserInterceptor userInterceptor;

    public RegisterInterceptorsConfig(UserInterceptor userInterceptor) {
        this.userInterceptor = userInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(userInterceptor).addPathPatterns(USER_INTERCEPT_PATHS);
    }

    @Override
    protected void addArgumentResolvers(List<HandlerMethodArgumentResolver> argumentResolvers) {
        argumentResolvers.add(new PageableHandlerMethodArgumentResolver());
    }
}

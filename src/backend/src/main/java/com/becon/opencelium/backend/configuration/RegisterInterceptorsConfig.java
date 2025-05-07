package com.becon.opencelium.backend.configuration;

import com.becon.opencelium.backend.configuration.interceptors.MasterPasswordInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurationSupport;

import java.util.List;

@Configuration
public class RegisterInterceptorsConfig extends WebMvcConfigurationSupport {

    private static final List<String> MASTER_PASSWORD_SUPPORTING_INTERCEPT_PATHS = List.of("/connector/**");

    private final MasterPasswordInterceptor masterPasswordInterceptor;

    public RegisterInterceptorsConfig(MasterPasswordInterceptor masterPasswordInterceptor) {
        this.masterPasswordInterceptor = masterPasswordInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(masterPasswordInterceptor).addPathPatterns(MASTER_PASSWORD_SUPPORTING_INTERCEPT_PATHS);
    }

    @Override
    protected void addArgumentResolvers(List<HandlerMethodArgumentResolver> argumentResolvers) {
        argumentResolvers.add(new PageableHandlerMethodArgumentResolver());
    }
}

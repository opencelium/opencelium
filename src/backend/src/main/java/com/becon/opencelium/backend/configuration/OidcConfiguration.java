package com.becon.opencelium.backend.configuration;

import com.becon.opencelium.backend.database.mysql.service.UserService;
import com.becon.opencelium.backend.security.oidc.LazyClientRegistrationRepository;
import com.becon.opencelium.backend.security.oidc.OidcAuthenticationProvider;
import com.becon.opencelium.backend.security.oidc.OidcClientRegistrationFactory;
import com.becon.opencelium.backend.security.oidc.OidcLoginService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.http.converter.FormHttpMessageConverter;
import org.springframework.security.oauth2.client.endpoint.DefaultAuthorizationCodeTokenResponseClient;
import org.springframework.security.oauth2.client.endpoint.OAuth2AccessTokenResponseClient;
import org.springframework.security.oauth2.client.endpoint.OAuth2AuthorizationCodeGrantRequest;
import org.springframework.security.oauth2.client.http.OAuth2ErrorResponseErrorHandler;
import org.springframework.security.oauth2.client.oidc.authentication.OidcIdTokenDecoderFactory;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.core.http.converter.OAuth2AccessTokenResponseHttpMessageConverter;
import org.springframework.security.oauth2.jwt.JwtDecoderFactory;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;

/**
 * OIDC client wiring, kept out of SecurityConfiguration to avoid a dependency cycle: the login
 * service needs these beans, and SecurityConfiguration needs the login service's provider.
 */
@Configuration
public class OidcConfiguration {

    /**
     * Discovery runs on the first /oidc/authorize and the outcome is cached, so that restarting
     * OpenCelium does not depend on the identity provider being reachable.
     */
    @Bean
    public ClientRegistrationRepository oidcClientRegistrationRepository(OidcProperties oidcProperties,
                                                                        OidcClientRegistrationFactory factory) {
        if (!oidcProperties.isEnabled()) {
            return registrationId -> null;
        }

        return new LazyClientRegistrationRepository(OidcProperties.REGISTRATION_ID, factory::create);
    }

    @Bean
    public OidcClientRegistrationFactory oidcClientRegistrationFactory(OidcProperties oidcProperties) {
        return new OidcClientRegistrationFactory(oidcProperties);
    }

    @Bean
    public OAuth2AccessTokenResponseClient<OAuth2AuthorizationCodeGrantRequest> oidcTokenResponseClient(
            OidcProperties oidcProperties) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(oidcProperties.getTimeout());
        requestFactory.setReadTimeout(oidcProperties.getTimeout());

        // Same converters as the client installs itself - replacing them with the defaults of a
        // plain RestTemplate would leave 'id_token' and OAuth2 error responses undecoded - only the
        // timeouts are added on top.
        RestTemplate restTemplate = new RestTemplate(
                Arrays.asList(new FormHttpMessageConverter(), new OAuth2AccessTokenResponseHttpMessageConverter()));
        restTemplate.setRequestFactory(requestFactory);
        restTemplate.setErrorHandler(new OAuth2ErrorResponseErrorHandler());

        DefaultAuthorizationCodeTokenResponseClient tokenResponseClient = new DefaultAuthorizationCodeTokenResponseClient();
        tokenResponseClient.setRestOperations(restTemplate);

        return tokenResponseClient;
    }

    @Bean
    public JwtDecoderFactory<ClientRegistration> oidcIdTokenDecoderFactory() {
        return new OidcIdTokenDecoderFactory();
    }

    @Bean
    public OidcAuthenticationProvider oidcAuthenticationProvider(OidcLoginService oidcLoginService,
                                                                 UserService userService,
                                                                 OidcProperties oidcProperties) {
        return new OidcAuthenticationProvider(oidcLoginService, userService, oidcProperties);
    }
}

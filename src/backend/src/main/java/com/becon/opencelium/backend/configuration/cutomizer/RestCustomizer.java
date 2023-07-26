package com.becon.opencelium.backend.configuration.cutomizer;

import com.becon.opencelium.backend.constant.SecurityConstant;
import org.apache.hc.client5.http.classic.HttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClientBuilder;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder;
import org.apache.hc.client5.http.impl.routing.DefaultProxyRoutePlanner;
import org.apache.hc.client5.http.routing.HttpRoutePlanner;
import org.apache.hc.client5.http.ssl.NoopHostnameVerifier;
import org.apache.hc.client5.http.ssl.SSLConnectionSocketFactory;
import org.apache.hc.core5.http.HttpException;
import org.apache.hc.core5.http.HttpHost;
import org.apache.hc.core5.http.protocol.HttpContext;
import org.springframework.boot.web.client.RestTemplateCustomizer;
import org.springframework.http.MediaType;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.client.RestTemplate;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.security.cert.X509Certificate;
import java.time.Duration;
import java.util.Collections;
import java.util.Objects;

public class RestCustomizer implements RestTemplateCustomizer {

    private String proxyHost;
    private String proxyPort;
    private boolean sslCert = false;
    private int timeout = 0;

    public RestCustomizer() {
    }

    public RestCustomizer(String host, String port) {
        this.proxyHost = host;
        this.proxyPort = port;
    }

    public RestCustomizer(String host, String port, boolean sslCert) {
        this.proxyHost = host;
        this.proxyPort = port;
        this.sslCert = sslCert;
    }

    public RestCustomizer(String host, String port, boolean sslCert, int timeout) {
        this.proxyHost = host;
        this.proxyPort = port;
        this.sslCert = sslCert;
        this.timeout = timeout;
    }

    @Override
    public void customize(RestTemplate restTemplate) {

        HttpComponentsClientHttpRequestFactory requestFactory = new HttpComponentsClientHttpRequestFactory();
        if (sslCert) {
            requestFactory = new HttpComponentsClientHttpRequestFactory(getDisabledHttpsClient());
        }
        requestFactory.setConnectionRequestTimeout(SecurityConstant.CONN_REQ_TIMEOUT);
        timeout = timeout > 0 ? timeout : SecurityConstant.CONN_TIMEOUT;
        requestFactory.setConnectTimeout(timeout);

        // Setting proxy
        if (proxyHost != null && proxyPort != null && !proxyHost.isEmpty() && !proxyPort.isEmpty()) {
            HttpRoutePlanner routePlanner = new CustomRoutePlanner(new HttpHost(proxyHost, proxyPort));
            HttpClient httpClient = HttpClientBuilder.create().setRoutePlanner(routePlanner).build();
            requestFactory.setHttpClient(httpClient);
        }
        restTemplate.setRequestFactory(requestFactory);

        // Adding text/html converter
        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter();
        converter.setSupportedMediaTypes(Collections.singletonList(MediaType.TEXT_HTML));
        restTemplate.getMessageConverters().add(converter);
    }

    private CloseableHttpClient getDisabledHttpsClient() {

        try {
            TrustManager[] trustAllCerts = new TrustManager[] {
                    new X509TrustManager() {
                        public java.security.cert.X509Certificate[] getAcceptedIssuers() {
                            return new X509Certificate[0];
                        }
                        public void checkClientTrusted(
                                java.security.cert.X509Certificate[] certs, String authType) {
                        }
                        public void checkServerTrusted(
                                java.security.cert.X509Certificate[] certs, String authType) {
                        }
                    }
            };
            SSLContext sslContext = SSLContext.getInstance("SSL");
            sslContext.init(null, trustAllCerts, new java.security.SecureRandom());
            SSLConnectionSocketFactory ssl = new SSLConnectionSocketFactory(sslContext, NoopHostnameVerifier.INSTANCE);
            PoolingHttpClientConnectionManager connectionManager = PoolingHttpClientConnectionManagerBuilder.create()
                    .setSSLSocketFactory(ssl).build();

            if(proxyHost != null && proxyPort != null && !proxyHost.isEmpty() && !proxyPort.isEmpty()) {
                HttpHost proxy = new HttpHost("PROXY_SERVER_HOST", "PROXY_SERVER_PORT");
                return HttpClients.custom().setProxy(proxy).setConnectionManager(connectionManager).build();
            }
            return HttpClients.custom().setConnectionManager(connectionManager).build();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    static class CustomRoutePlanner extends DefaultProxyRoutePlanner {
        CustomRoutePlanner(HttpHost proxy) {
            super(proxy);
        }

        @Override
        protected HttpHost determineProxy(HttpHost target, HttpContext context) throws HttpException {
            return super.determineProxy(target, context);
        }
    }
}

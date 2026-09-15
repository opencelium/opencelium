package io.opencelium.core.config.startup;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoDatabase;
import io.opencelium.core.config.TenancyProperties;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mock.env.MockEnvironment;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;
import static org.assertj.core.api.Assertions.catchThrowable;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DatabaseStartupCheckTest {

    private static final String URI_WITH_PASSWORD = "mongodb://oc:canary-8f31c2a7@db.example.com:27017/opencelium";

    private final MongoClient mongoClient = mock(MongoClient.class);
    private final MongoDatabase database = mock(MongoDatabase.class);

    @Test
    void startupFailsNamingThePropertyWhenSelfHostedHasNoUri() {
        assertThatIllegalStateException()
                .isThrownBy(() -> check(selfHosted(true), new MockEnvironment()).afterPropertiesSet())
                .withMessageContaining(DatabaseStartupCheck.URI_PROPERTY)
                .withMessageContaining("localhost:27017");
    }

    @Test
    void startupSucceedsInCloudModeWithoutAnyDatabaseConfigured() {
        assertThatCode(() -> check(cloud(), new MockEnvironment()).afterPropertiesSet()).doesNotThrowAnyException();

        verify(mongoClient, never()).getDatabase(anyString());
    }

    @Test
    void startupDoesNotTouchTheDatabaseWhenVerificationIsOff() {
        assertThatCode(() -> check(selfHosted(false), environmentWithUri()).afterPropertiesSet())
                .doesNotThrowAnyException();

        verify(mongoClient, never()).getDatabase(anyString());
    }

    @Test
    void startupPingsTheDatabaseWhenVerificationIsOn() {
        when(mongoClient.getDatabase(anyString())).thenReturn(database);
        when(database.runCommand(any(Bson.class))).thenReturn(new Document("ok", 1));

        assertThatCode(() -> check(selfHosted(true), environmentWithUri()).afterPropertiesSet())
                .doesNotThrowAnyException();

        verify(mongoClient).getDatabase("opencelium");
        verify(database).runCommand(any(Bson.class));
    }

    @Test
    void startupFailureNamesTheHostButNeverThePasswordWhenTheDatabaseIsUnreachable() {
        when(mongoClient.getDatabase(anyString())).thenReturn(database);
        when(database.runCommand(any(Bson.class))).thenThrow(new IllegalStateException("connection refused"));

        Throwable failure = catchThrowable(() -> check(selfHosted(true), environmentWithUri()).afterPropertiesSet());

        assertThat(failure).isInstanceOf(IllegalStateException.class);
        assertThat(failure.getMessage()).contains("db.example.com:27017").doesNotContain("canary");
    }

    @Test
    void startupFailsWhenTheUriCannotBeParsed() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty(DatabaseStartupCheck.URI_PROPERTY, "not-a-mongodb-uri");

        assertThatIllegalStateException()
                .isThrownBy(() -> check(selfHosted(true), environment).afterPropertiesSet())
                .withMessageContaining(DatabaseStartupCheck.URI_PROPERTY);
    }

    private static MockEnvironment environmentWithUri() {
        return new MockEnvironment().withProperty(DatabaseStartupCheck.URI_PROPERTY, URI_WITH_PASSWORD);
    }

    private DatabaseStartupCheck check(TenancyProperties tenancy, MockEnvironment environment) {
        return new DatabaseStartupCheck(tenancy, environment, providerOf(mongoClient));
    }

    private static TenancyProperties selfHosted(boolean verifyOnStartup) {
        return new TenancyProperties(TenancyProperties.Mode.SELF_HOSTED,
                new TenancyProperties.SelfHosted(verifyOnStartup), defaultCloud());
    }

    private static TenancyProperties cloud() {
        return new TenancyProperties(TenancyProperties.Mode.CLOUD,
                new TenancyProperties.SelfHosted(true), defaultCloud());
    }

    private static TenancyProperties.Cloud defaultCloud() {
        return new TenancyProperties.Cloud(new TenancyProperties.ClientCache(50, Duration.ofMinutes(30)),
                new TenancyProperties.Pool(20), Duration.ofSeconds(10), Duration.ofMinutes(15));
    }

    @SuppressWarnings("unchecked")
    private static ObjectProvider<MongoClient> providerOf(MongoClient client) {
        ObjectProvider<MongoClient> provider = mock(ObjectProvider.class);
        when(provider.getObject()).thenReturn(client);
        return provider;
    }
}

package com.becon.opencelium.backend.unit.execution.notification;

import com.becon.opencelium.backend.execution.notification.IncomingWebhookService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/**
 * Unit tests for {@link IncomingWebhookService}.
 * <p>
 * The service is constructed directly with a plain {@link RestTemplate} bound to a
 * {@link MockRestServiceServer}; template files are read from {@code src/main/resources/notification}
 * which is on the test classpath. No Spring context is loaded.
 */
@DisplayName("IncomingWebhookService — unit")
class IncomingWebhookServiceTest {

    private MockRestServiceServer server;
    private IncomingWebhookService service;

    @BeforeEach
    void setUp() {
        RestTemplate restTemplate = new RestTemplate();
        server = MockRestServiceServer.createServer(restTemplate);
        service = new IncomingWebhookService(restTemplate, new ObjectMapper());
    }

    @Nested
    @DisplayName("template selection")
    class TemplateSelection {

        @Test
        @DisplayName("no prefix and no keyword uses default.json ({\"text\": ...})")
        void sendMessageUsesDefaultTemplateWhenNoPrefixOrKeyword() {
            server.expect(requestTo("https://hooks.example.com/generic"))
                    .andExpect(method(HttpMethod.POST))
                    .andExpect(jsonPath("$.text").value("Subject\nBody"))
                    .andRespond(withSuccess());

            boolean sent = service.sendMessage("https://hooks.example.com/generic", "Subject", "Body");

            assertThat(sent).isTrue();
            server.verify();
        }

        @Test
        @DisplayName("URL containing 'slack' selects slack.json")
        void sendMessageUsesSlackTemplateWhenUrlContainsSlack() {
            server.expect(requestTo("https://hooks.slack.com/services/T000/B000/xxxx"))
                    .andExpect(jsonPath("$.blocks[0].text.text").value("Subject"))
                    .andExpect(jsonPath("$.blocks[1].text.text").value("Body"))
                    .andRespond(withSuccess());

            boolean sent = service.sendMessage("https://hooks.slack.com/services/T000/B000/xxxx", "Subject", "Body");

            assertThat(sent).isTrue();
            server.verify();
        }

        @Test
        @DisplayName("URL containing 'teams' selects teams.json")
        void sendMessageUsesTeamsTemplateWhenUrlContainsTeams() {
            server.expect(requestTo("https://outlook.office.com/webhook/teams/abc"))
                    .andExpect(jsonPath("$.attachments[0].content.body[0].text").value("Subject"))
                    .andExpect(jsonPath("$.attachments[0].content.body[1].text").value("Body"))
                    .andRespond(withSuccess());

            boolean sent = service.sendMessage("https://outlook.office.com/webhook/teams/abc", "Subject", "Body");

            assertThat(sent).isTrue();
            server.verify();
        }

        @Test
        @DisplayName("URL with a keyword that has no matching template file falls back to default.json")
        void sendMessageUsesDefaultTemplateWhenKeywordHasNoMatchingTemplateFile() {
            // 'microsoft' is not a shipped template file name, so this must NOT select teams.json.
            server.expect(requestTo("https://mydomain.webhook.office.microsoft.com/hook"))
                    .andExpect(jsonPath("$.text").value("Subject\nBody"))
                    .andRespond(withSuccess());

            boolean sent = service.sendMessage("https://mydomain.webhook.office.microsoft.com/hook", "Subject", "Body");

            assertThat(sent).isTrue();
            server.verify();
        }

        @Test
        @DisplayName("[teams] prefix selects teams.json and is stripped before the POST")
        void sendMessageStripsPrefixAndUsesTeamsTemplateWhenDestinationHasTeamsPrefix() {
            // The URL has no 'teams'/'microsoft' keyword, so only the prefix can select teams.json.
            server.expect(requestTo("https://hooks.example.com/generic"))
                    .andExpect(method(HttpMethod.POST))
                    .andExpect(jsonPath("$.attachments[0].content.body[0].text").value("Subject"))
                    .andRespond(withSuccess());

            boolean sent = service.sendMessage("[teams]https://hooks.example.com/generic", "Subject", "Body");

            assertThat(sent).isTrue();
            server.verify();
        }

        @Test
        @DisplayName("prefix wins over a conflicting keyword in the URL")
        void sendMessageUsesPrefixTemplateWhenPrefixConflictsWithUrlKeyword() {
            // URL contains 'slack' but the [teams] prefix must win.
            server.expect(requestTo("https://hooks.slack.com/services/xxx"))
                    .andExpect(jsonPath("$.attachments[0].content.body[0].text").value("Subject"))
                    .andRespond(withSuccess());

            boolean sent = service.sendMessage("[teams]https://hooks.slack.com/services/xxx", "Subject", "Body");

            assertThat(sent).isTrue();
            server.verify();
        }

        @Test
        @DisplayName("missing template for [foo] prefix falls back to default.json")
        void sendMessageFallsBackToDefaultTemplateWhenPrefixedTemplateFileMissing() {
            server.expect(requestTo("https://hooks.example.com/generic"))
                    .andExpect(jsonPath("$.text").value("Subject\nBody"))
                    .andRespond(withSuccess());

            boolean sent = service.sendMessage("[foo]https://hooks.example.com/generic", "Subject", "Body");

            assertThat(sent).isTrue();
            server.verify();
        }
    }

    @Nested
    @DisplayName("substitution")
    class Substitution {

        @Test
        @DisplayName("special characters stay valid JSON with the default template")
        void sendMessageProducesValidJsonWhenValuesContainSpecialCharsWithDefaultTemplate() {
            String subject = "he said \"hi\"";
            String body = "path\\to\\file\nnew line";

            server.expect(requestTo("https://hooks.example.com/generic"))
                    // jsonPath parsing only succeeds if the delivered body is valid JSON.
                    .andExpect(jsonPath("$.text").value(subject + "\n" + body))
                    .andRespond(withSuccess());

            boolean sent = service.sendMessage("https://hooks.example.com/generic", subject, body);

            assertThat(sent).isTrue();
            server.verify();
        }

        @Test
        @DisplayName("special characters stay valid JSON with the slack template")
        void sendMessageProducesValidJsonWhenValuesContainSpecialCharsWithSlackTemplate() {
            String subject = "quote \" and backslash \\";
            String body = "line1\nline2 — unicode ✓";

            server.expect(requestTo("https://hooks.slack.com/services/xxx"))
                    .andExpect(jsonPath("$.blocks[0].text.text").value(subject))
                    .andExpect(jsonPath("$.blocks[1].text.text").value(body))
                    .andRespond(withSuccess());

            boolean sent = service.sendMessage("https://hooks.slack.com/services/xxx", subject, body);

            assertThat(sent).isTrue();
            server.verify();
        }

        @Test
        @DisplayName("a subject that itself looks like a placeholder is not re-substituted")
        void sendMessageDoesNotReSubstituteWhenValueLooksLikePlaceholder() {
            server.expect(requestTo("https://hooks.example.com/generic"))
                    .andExpect(jsonPath("$.text").value("${text}\nActual body"))
                    .andRespond(withSuccess());

            boolean sent = service.sendMessage("https://hooks.example.com/generic", "${text}", "Actual body");

            assertThat(sent).isTrue();
            server.verify();
        }
    }

    @Nested
    @DisplayName("invalid destinations")
    class InvalidDestinations {

        @Test
        @DisplayName("a destination that is not a valid URI is handled without reaching RestTemplate")
        void sendMessageReturnsFalseWhenUriIsInvalidAfterPrefixStripping() {
            // No server expectation registered: any HTTP call would fail the test.
            boolean sent = service.sendMessage("[teams]http://has a space/hook", "Subject", "Body");

            assertThat(sent).isFalse();
            server.verify();
        }

        @Test
        @DisplayName("a relative URL (no scheme/host) after stripping is rejected")
        void sendMessageReturnsFalseWhenUrlIsRelativeAfterPrefixStripping() {
            boolean sent = service.sendMessage("[teams]not-a-url", "Subject", "Body");

            assertThat(sent).isFalse();
            server.verify();
        }
    }
}

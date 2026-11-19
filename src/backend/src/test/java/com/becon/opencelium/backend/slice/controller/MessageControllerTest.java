package com.becon.opencelium.backend.slice.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.becon.opencelium.backend.application.language.LanguageService;
import com.becon.opencelium.backend.configuration.interceptors.MasterPasswordInterceptor;
import com.becon.opencelium.backend.controller.MessageController;
import com.becon.opencelium.backend.database.mysql.entity.EventContent;
import com.becon.opencelium.backend.database.mysql.entity.EventMessage;
import com.becon.opencelium.backend.database.mysql.service.ContentServiceImpl;
import com.becon.opencelium.backend.database.mysql.service.GlobalVariableUsageService;
import com.becon.opencelium.backend.database.mysql.service.MessageServiceImpl;
import com.becon.opencelium.backend.exception.GlobalReferenceValidationException;
import com.becon.opencelium.backend.exception.GlobalReferenceValidationException.Code;
import com.becon.opencelium.backend.exception.GlobalReferenceValidationException.Violation;
import com.becon.opencelium.backend.security.AuthenticationFilter;
import com.becon.opencelium.backend.security.AuthorizationFilter;
import com.becon.opencelium.backend.security.TotpAuthenticationFilter;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Slice tests for what {@link MessageController} does about the global variable references of
 * a notification template: a create and an update check them before anything is saved, and an
 * update writes the usages anew once the template is saved.
 *
 * <p>Web layer only: the services are mocked and security filters are excluded the same way as
 * in the other controller slice tests. The mapping between the request and the template entity
 * is the real one, so the template that is checked is the one that was sent.
 *
 * <p>Run with: ./gradlew test --tests "*.MessageControllerTest"
 */
@WebMvcTest(
        controllers = MessageController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = {
                        AuthenticationFilter.class,
                        AuthorizationFilter.class,
                        TotpAuthenticationFilter.class
                }
        )
)
@ActiveProfiles("test")
@DisplayName("MessageController — global variable references web slice")
class MessageControllerTest {

    private static final int TEMPLATE = 3;

    private static final String TEMPLATE_BODY = """
            {
              "name": "Failure template",
              "type": "email",
              "content": [
                { "language": "en", "subject": "{{global.product}} failed", "body": "See {{global.supportUrl}}" }
              ]
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MessageServiceImpl messageService;

    @MockBean
    private ContentServiceImpl contentService;

    // also read by the validator of the content language
    @MockBean
    private LanguageService languageService;

    @MockBean
    private GlobalVariableUsageService globalVariableUsageService;

    // Pulled in by RegisterInterceptorsConfig (a WebMvcConfigurer the slice loads).
    @MockBean
    private MasterPasswordInterceptor masterPasswordInterceptor;

    @BeforeEach
    void setUp() {
        when(messageService.toEntity(any())).thenCallRealMethod();
        when(messageService.toResource(any())).thenCallRealMethod();
        when(languageService.isSupported("en")).thenReturn(true);
    }

    // ── PUT /message/{id} ─────────────────────────────────────────────────────

    @Test
    @DisplayName("PUT /message/{id} — a rejected reference answers 400, and neither the template nor a text is saved")
    void updateMessageReturnsBadRequestWhenReferenceIsRejected() throws Exception {
        doThrow(aRejectedReference()).when(globalVariableUsageService).checkTemplate(any());

        mockMvc.perform(put("/message/{id}", TEMPLATE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(TEMPLATE_BODY))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("GLOBAL_REFERENCE_INVALID"))
                .andExpect(jsonPath("$.violations[0].code").value("OUT_OF_SCOPE"))
                .andExpect(jsonPath("$.violations[0].variable").value("supportUrl"))
                .andExpect(jsonPath("$.violations[0].field").value("en.body"))
                .andExpect(jsonPath("$.violations[0].color").doesNotHaveJsonPath())
                .andExpect(jsonPath("$.violations[0].index").doesNotHaveJsonPath());

        verify(messageService, never()).save(any());
        verifyNoInteractions(contentService);
        verify(globalVariableUsageService, never()).rebuildForTemplate(any());
    }

    @Test
    @DisplayName("PUT /message/{id} — the usages are written anew once the template and its texts are saved")
    void updateMessageRebuildsUsagesWhenTemplateIsSaved() throws Exception {
        ArgumentCaptor<EventMessage> saved = ArgumentCaptor.forClass(EventMessage.class);
        ArgumentCaptor<EventMessage> rebuilt = ArgumentCaptor.forClass(EventMessage.class);

        mockMvc.perform(put("/message/{id}", TEMPLATE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(TEMPLATE_BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.templateId").value(TEMPLATE))
                .andExpect(jsonPath("$.name").value("Failure template"));

        InOrder order = inOrder(messageService, contentService, globalVariableUsageService);
        order.verify(messageService).save(saved.capture());
        order.verify(contentService).save(any(EventContent.class));
        order.verify(globalVariableUsageService).rebuildForTemplate(rebuilt.capture());
        assertThat(rebuilt.getValue()).isSameAs(saved.getValue());
        assertThat(rebuilt.getValue().getId()).isEqualTo(TEMPLATE);
    }

    // ── POST /message ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /message — a new template is checked as it was sent, before it is saved")
    void createMessageChecksTemplateWhenTemplateIsNew() throws Exception {
        ArgumentCaptor<EventMessage> checked = ArgumentCaptor.forClass(EventMessage.class);

        mockMvc.perform(post("/message")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(TEMPLATE_BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Failure template"));

        InOrder order = inOrder(globalVariableUsageService, messageService);
        order.verify(globalVariableUsageService).checkTemplate(checked.capture());
        order.verify(messageService).save(checked.getValue());
        assertThat(checked.getValue().getId()).isZero();
        assertThat(checked.getValue().getEventContents())
                .extracting(EventContent::getLanguage, EventContent::getSubject, EventContent::getBody)
                .containsExactly(tuple("en", "{{global.product}} failed", "See {{global.supportUrl}}"));
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    /** What the reference check throws for a template whose notification runs a workflow out of scope. */
    private static GlobalReferenceValidationException aRejectedReference() {
        return new GlobalReferenceValidationException(List.of(new Violation(
                Code.OUT_OF_SCOPE,
                "The workflow of notification 'Nightly' is outside the scope of global variable 'supportUrl'",
                "supportUrl", "{{global.supportUrl}}", null, null, "en.body")));
    }
}

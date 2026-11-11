package com.becon.opencelium.backend.slice.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.becon.opencelium.backend.configuration.interceptors.MasterPasswordInterceptor;
import com.becon.opencelium.backend.controller.LanguageController;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.resource.languages.ScriptValidationRequest;
import com.becon.opencelium.backend.resource.languages.ScriptValidationResultDTO;
import com.becon.opencelium.backend.resource.languages.ScriptValidationResultDTO.ScriptErrorDTO;
import com.becon.opencelium.backend.scriptengine.client.ScriptLanguageService;
import com.becon.opencelium.backend.scriptengine.client.ScriptValidationService;
import com.becon.opencelium.backend.security.AuthenticationFilter;
import com.becon.opencelium.backend.security.AuthorizationFilter;
import com.becon.opencelium.backend.security.TotpAuthenticationFilter;
import com.becon.opencelium.backend.storage.StorageService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Slice tests for {@link LanguageController}.
 *
 * <p>Loads only the web layer; security filters are excluded the same way as in the other
 * controller slice tests.
 *
 * <p>Run with: ./gradlew test --tests "*.LanguageControllerTest"
 */
@WebMvcTest(
    controllers = LanguageController.class,
    excludeFilters =
        @ComponentScan.Filter(
            type = FilterType.ASSIGNABLE_TYPE,
            classes = {
              AuthenticationFilter.class,
              AuthorizationFilter.class,
              TotpAuthenticationFilter.class
            }))
@ActiveProfiles("test")
@DisplayName("LanguageController — web slice")
class LanguageControllerTest {

  private static final String INVALID_SCRIPT_BODY =
      "{\"language\":\"js\",\"script\":\"var b = a +;\"}";

  @Autowired private MockMvc mockMvc;

  @MockBean private ScriptLanguageService scriptLanguageService;

  @MockBean private ScriptValidationService scriptValidationService;

  @MockBean private StorageService storageService;

  // Pulled in by RegisterInterceptorsConfig; mocked so its ConnectorProps dependency
  // need not be resolved in the slice.
  @MockBean private MasterPasswordInterceptor masterPasswordInterceptor;

  // ── POST /lang-code/validate ───────────────────────────────────────────────

  @Test
  @DisplayName("POST /lang-code/validate — an invalid script is a 200 with valid = false")
  void validateScriptReturnsOkWhenScriptIsInvalid() throws Exception {
    ScriptErrorDTO error =
        new ScriptErrorDTO(
            1, 12, "Expected an operand but found ;", "var b = a +;", "A value is missing");
    given(scriptValidationService.validate(any(ScriptValidationRequest.class)))
        .willReturn(ScriptValidationResultDTO.invalid("js", error));

    mockMvc
        .perform(
            post("/lang-code/validate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(INVALID_SCRIPT_BODY))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.valid").value(false))
        .andExpect(jsonPath("$.language").value("js"))
        .andExpect(jsonPath("$.errors[0].line").value(1))
        .andExpect(jsonPath("$.errors[0].column").value(12))
        .andExpect(jsonPath("$.errors[0].codeLine").value("var b = a +;"))
        .andExpect(jsonPath("$.errors[0].hint").value("A value is missing"));
  }

  @Test
  void validateScriptReturnsBadRequestWhenServiceRejectsScript() throws Exception {
    given(scriptValidationService.validate(any(ScriptValidationRequest.class)))
        .willThrow(new GeneralServiceException("SCRIPT_IS_EMPTY", "Script must not be empty"));

    mockMvc
        .perform(
            post("/lang-code/validate")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"language\":\"js\",\"script\":\"\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("SCRIPT_IS_EMPTY"))
        .andExpect(jsonPath("$.message").value("Script must not be empty"));
  }
}

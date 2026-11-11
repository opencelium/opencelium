package com.becon.opencelium.backend.slice.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.becon.opencelium.backend.configuration.interceptors.MasterPasswordInterceptor;
import com.becon.opencelium.backend.controller.LanguageController;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.resource.languages.ScriptExecutionRequest;
import com.becon.opencelium.backend.resource.languages.ScriptExecutionResultDTO;
import com.becon.opencelium.backend.resource.languages.ScriptExecutionResultDTO.ErrorType;
import com.becon.opencelium.backend.resource.languages.ScriptExecutionResultDTO.ScriptExecutionErrorDTO;
import com.becon.opencelium.backend.resource.languages.ScriptValidationRequest;
import com.becon.opencelium.backend.resource.languages.ScriptValidationResultDTO;
import com.becon.opencelium.backend.resource.languages.ScriptValidationResultDTO.ScriptErrorDTO;
import com.becon.opencelium.backend.scriptengine.client.ScriptLanguageService;
import com.becon.opencelium.backend.scriptengine.client.ScriptRunService;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

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

  private static final String EXECUTE_BODY =
      "{\"language\":\"js\",\"script\":\"VAR_0 + 1\",\"variables\":{\"VAR_0\":{\"id\":7}}}";

  @Autowired private MockMvc mockMvc;

  @MockBean private ScriptLanguageService scriptLanguageService;

  @MockBean private ScriptValidationService scriptValidationService;

  @MockBean private ScriptRunService scriptRunService;

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

  // ── POST /lang-code/execute ────────────────────────────────────────────────

  @Test
  void executeScriptReturnsOkWithResultWhenScriptSucceeds() throws Exception {
    given(scriptRunService.run(any(ScriptExecutionRequest.class)))
        .willReturn(
            ScriptExecutionResultDTO.success("js", Map.of("id", 8), "object", "done\n", 12));

    mockMvc
        .perform(
            post("/lang-code/execute").contentType(MediaType.APPLICATION_JSON).content(EXECUTE_BODY))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.result.id").value(8))
        .andExpect(jsonPath("$.resultType").value("object"))
        .andExpect(jsonPath("$.output").value("done\n"))
        .andExpect(jsonPath("$.error").doesNotExist());
  }

  @Test
  @DisplayName("POST /lang-code/execute — a failing script is a 200 with success = false")
  void executeScriptReturnsOkWithErrorWhenScriptFails() throws Exception {
    ScriptExecutionErrorDTO error =
        new ScriptExecutionErrorDTO(
            ErrorType.RUNTIME, "ReferenceError", 1, null, "\"VAR_2\" is not defined",
            "VAR_0 + VAR_2", "Add a value for it");
    given(scriptRunService.run(any(ScriptExecutionRequest.class)))
        .willReturn(ScriptExecutionResultDTO.failure("js", "", 3, error));

    mockMvc
        .perform(
            post("/lang-code/execute").contentType(MediaType.APPLICATION_JSON).content(EXECUTE_BODY))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.error.type").value("RUNTIME"))
        .andExpect(jsonPath("$.error.name").value("ReferenceError"))
        .andExpect(jsonPath("$.error.line").value(1))
        .andExpect(jsonPath("$.error.hint").value("Add a value for it"));
  }

  @Test
  void executeScriptReturnsTooManyRequestsWhenAllSlotsAreBusy() throws Exception {
    given(scriptRunService.run(any(ScriptExecutionRequest.class)))
        .willThrow(
            new GeneralServiceException(
                HttpStatus.TOO_MANY_REQUESTS, "TOO_MANY_SCRIPT_RUNS", "Too many scripts"));

    mockMvc
        .perform(
            post("/lang-code/execute").contentType(MediaType.APPLICATION_JSON).content(EXECUTE_BODY))
        .andExpect(status().isTooManyRequests())
        .andExpect(jsonPath("$.error").value("TOO_MANY_SCRIPT_RUNS"));
  }
}

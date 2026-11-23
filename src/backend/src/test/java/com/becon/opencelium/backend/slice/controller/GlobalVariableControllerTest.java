package com.becon.opencelium.backend.slice.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.becon.opencelium.backend.configuration.interceptors.MasterPasswordInterceptor;
import com.becon.opencelium.backend.controller.GlobalVariableController;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableUsage;
import com.becon.opencelium.backend.database.mysql.service.GlobalVariableService;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableKind;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariablePermission;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableScopeType;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.exception.GlobalVariableConflictException;
import com.becon.opencelium.backend.exception.GlobalVariableValidationException;
import com.becon.opencelium.backend.exception.GlobalVariableValidationException.Code;
import com.becon.opencelium.backend.exception.GlobalVariableValidationException.Violation;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableImpactDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableListItemDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariablePickerItemDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableRequestDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableRestoreRequestDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableUsageDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableValueDTO;
import com.becon.opencelium.backend.resource.subs.PaginatedDto;
import com.becon.opencelium.backend.security.AuthenticationFilter;
import com.becon.opencelium.backend.security.AuthorizationFilter;
import com.becon.opencelium.backend.security.TotpAuthenticationFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.NullNode;
import com.fasterxml.jackson.databind.node.TextNode;
import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Slice tests for {@link GlobalVariableController}. The service is mocked and security filters
 * are excluded by application-test.yml; the {@code @PreAuthorize} rules are covered by the
 * reflective {@code GlobalVariableControllerSecurityAnnotationsTest}.
 *
 * <p>Run with: ./gradlew test --tests "*.GlobalVariableControllerTest"
 */
@WebMvcTest(
        controllers = GlobalVariableController.class,
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
@DisplayName("GlobalVariableController — web slice")
class GlobalVariableControllerTest {

    private static final String VALID_BODY = """
            {
              "name": "tenants",
              "kind": "CONSTANT",
              "value": [ { "id": "acme" } ],
              "secret": false,
              "scope": { "type": "ALL", "categoryIds": [], "workflowIds": [] },
              "version": 4
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private GlobalVariableService service;

    // Pulled in by RegisterInterceptorsConfig (a WebMvcConfigurer the slice loads).
    @MockBean
    private MasterPasswordInterceptor masterPasswordInterceptor;

    private final ObjectMapper json = new ObjectMapper();

    // ── GET /global-variable/{id} ─────────────────────────────────────────────

    @Test
    @DisplayName("get — the value is real JSON and times are ISO-8601 UTC strings")
    void getReturnsValueAsRealJsonWhenVariableExists() throws Exception {
        when(service.getById(7L)).thenReturn(aDetailDto());

        mockMvc.perform(get("/global-variable/{id}", 7).accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7))
                .andExpect(jsonPath("$.kind").value("CONSTANT"))
                .andExpect(jsonPath("$.value[0].id").value("acme"))
                .andExpect(jsonPath("$.scope.type").value("ALL"))
                .andExpect(jsonPath("$.myPermissions[0]").value("VIEW_USE"))
                .andExpect(jsonPath("$.version").value(4))
                .andExpect(jsonPath("$.updatedAt").value("2026-11-16T09:12:00Z"))
                .andExpect(jsonPath("$.updatedBy.type").value("USER"));
    }

    @Test
    void getReturnsForbiddenWhenServiceDeniesAccess() throws Exception {
        when(service.getById(7L)).thenThrow(new GeneralServiceException(
                HttpStatus.FORBIDDEN, "FORBIDDEN", "You have no VIEW_USE permission on global variable 'tenants'"));

        mockMvc.perform(get("/global-variable/{id}", 7).accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"))
                .andExpect(jsonPath("$.message").value("You have no VIEW_USE permission on global variable 'tenants'"));
    }

    // ── GET /global-variable/all ──────────────────────────────────────────────

    @Test
    void getAllPassesPagingAndFiltersWhenParametersAreGiven() throws Exception {
        when(service.findAll("url", GlobalVariableKind.CONSTANT, 2, 5, "updatedAt,desc"))
                .thenReturn(new PaginatedDto<GlobalVariable, GlobalVariableListItemDTO>(Page.empty(), variable -> null));

        mockMvc.perform(get("/global-variable/all")
                        .param("page", "2")
                        .param("size", "5")
                        .param("sort", "updatedAt,desc")
                        .param("search", "url")
                        .param("kind", "CONSTANT")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalItems").value(0));

        verify(service).findAll("url", GlobalVariableKind.CONSTANT, 2, 5, "updatedAt,desc");
    }

    @Test
    void getAllUsesDefaultsWhenNoParameterIsGiven() throws Exception {
        when(service.findAll(null, null, 0, 20, "name,asc"))
                .thenReturn(new PaginatedDto<GlobalVariable, GlobalVariableListItemDTO>(Page.empty(), variable -> null));

        mockMvc.perform(get("/global-variable/all").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        verify(service).findAll(null, null, 0, 20, "name,asc");
    }

    // ── GET /global-variable/unique/{name} ────────────────────────────────────

    @Test
    void isNameUniqueReturnsTrueWhenNameIsFree() throws Exception {
        when(service.isNameAvailable("idoitUrl")).thenReturn(true);

        mockMvc.perform(get("/global-variable/unique/{name}", "idoitUrl").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result").value(true));
    }

    // ── POST /global-variable ─────────────────────────────────────────────────

    @Test
    @DisplayName("create — the body reaches the service with its value as JSON")
    void createReturnsCreatedVariableWhenRequestIsValid() throws Exception {
        when(service.create(any())).thenReturn(aDetailDto());

        mockMvc.perform(post("/global-variable").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("tenants"));

        verify(service).create(new GlobalVariableRequestDTO("tenants", GlobalVariableKind.CONSTANT, null,
                json.readTree("[{\"id\":\"acme\"}]"), false,
                new GlobalVariableRequestDTO.Scope(GlobalVariableScopeType.ALL, List.of(), List.of()), null, null, 4L));
    }

    @Test
    @DisplayName("create — a script body reaches the service with its parameters and their defaults")
    void createPassesScriptToServiceWhenBodyHasScript() throws Exception {
        when(service.create(any())).thenReturn(aDetailDto());
        String body = """
                {"name": "formatDate", "kind": "SCRIPT", "scope": {"type": "ALL"},
                 "script": {"language": "js", "code": "return date;",
                            "parameters": [{"name": "date", "required": true},
                                           {"name": "pattern", "default": "dd.MM.yyyy"}]}}""";

        mockMvc.perform(post("/global-variable").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk());

        verify(service).create(new GlobalVariableRequestDTO("formatDate", GlobalVariableKind.SCRIPT, null, null, null,
                new GlobalVariableRequestDTO.Scope(GlobalVariableScopeType.ALL, null, null), null, null, null,
                new GlobalVariableRequestDTO.Script("js", "return date;", List.of(
                        new GlobalVariableRequestDTO.Parameter("date", null, true, null),
                        new GlobalVariableRequestDTO.Parameter("pattern", null, null, TextNode.valueOf("dd.MM.yyyy"))))));
    }

    @Test
    @DisplayName("create — a rejected request answers 400 with one violation per field")
    void createReturnsBadRequestWithViolationsWhenRequestIsInvalid() throws Exception {
        when(service.create(any())).thenThrow(new GlobalVariableValidationException(List.of(
                new Violation("name", Code.NAME_TAKEN, "Name 'tenants' is already taken"),
                new Violation("scope", Code.SCOPE_REQUIRED, "The scope is required"))));

        mockMvc.perform(post("/global-variable").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.timestamp").isString())
                .andExpect(jsonPath("$.error").value("GLOBAL_VARIABLE_INVALID"))
                .andExpect(jsonPath("$.message").value("Name 'tenants' is already taken"))
                .andExpect(jsonPath("$.path").value("/global-variable"))
                .andExpect(jsonPath("$.violations.length()").value(2))
                .andExpect(jsonPath("$.violations[0].field").value("name"))
                .andExpect(jsonPath("$.violations[0].code").value("NAME_TAKEN"))
                .andExpect(jsonPath("$.violations[1].field").value("scope"))
                .andExpect(jsonPath("$.currentVersion").doesNotExist());
    }

    // ── PUT /global-variable/{id} ─────────────────────────────────────────────

    @Test
    @DisplayName("update — a stale version answers 409 with the version to reload")
    void updateReturnsConflictWithCurrentVersionWhenVersionIsStale() throws Exception {
        when(service.update(eq(7L), any())).thenThrow(new GlobalVariableConflictException(
                GlobalVariableConflictException.Code.VERSION_CONFLICT,
                "Changed by admin at 2026-11-19T10:14:02Z, reload to see the new value", 5L));

        mockMvc.perform(put("/global-variable/{id}", 7).contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("GLOBAL_VARIABLE_CONFLICT"))
                .andExpect(jsonPath("$.code").value("VERSION_CONFLICT"))
                .andExpect(jsonPath("$.currentVersion").value(5))
                .andExpect(jsonPath("$.blocking").isEmpty())
                .andExpect(jsonPath("$.violations").doesNotExist());
    }

    @Test
    @DisplayName("update — an explicit null reaches the service as JSON null, which keeps a secret")
    void updatePassesJsonNullWhenBodySendsNullValue() throws Exception {
        when(service.update(eq(7L), any())).thenReturn(aDetailDto());
        String body = VALID_BODY.replace("\"value\": [ { \"id\": \"acme\" } ]", "\"value\": null");

        mockMvc.perform(put("/global-variable/{id}", 7).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk());

        ArgumentCaptor<GlobalVariableRequestDTO> request = ArgumentCaptor.forClass(GlobalVariableRequestDTO.class);
        verify(service).update(eq(7L), request.capture());
        assertThat(request.getValue().value()).isEqualTo(NullNode.getInstance());
    }

    @Test
    void updateReturnsBadRequestWhenSecretRemovalHasNoValue() throws Exception {
        when(service.update(eq(7L), any())).thenThrow(new GlobalVariableValidationException(List.of(
                new Violation("value", Code.SECRET_REMOVAL_NEEDS_VALUE,
                        "Give a new value to make a secret visible again: its hidden value is never shown"))));

        mockMvc.perform(put("/global-variable/{id}", 7).contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("GLOBAL_VARIABLE_INVALID"))
                .andExpect(jsonPath("$.violations[0].field").value("value"))
                .andExpect(jsonPath("$.violations[0].code").value("SECRET_REMOVAL_NEEDS_VALUE"));
    }

    // ── DELETE /global-variable/{id} ──────────────────────────────────────────

    @Test
    void deleteReturnsNoContentWhenVariableIsDeleted() throws Exception {
        mockMvc.perform(delete("/global-variable/{id}", 7))
                .andExpect(status().isNoContent());

        verify(service).delete(7L);
    }

    @Test
    void deleteReturnsNotFoundWhenVariableDoesNotExist() throws Exception {
        doThrow(new GeneralServiceException(
                HttpStatus.NOT_FOUND, "GLOBAL_VARIABLE_NOT_FOUND", "Global variable 7 does not exist"))
                .when(service).delete(7L);

        mockMvc.perform(delete("/global-variable/{id}", 7))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("GLOBAL_VARIABLE_NOT_FOUND"));
    }

    @Test
    @DisplayName("delete — a used variable answers 409 with the usages that block it")
    void deleteReturnsConflictWithBlockingWhenVariableIsUsed() throws Exception {
        doThrow(new GlobalVariableConflictException(
                GlobalVariableConflictException.Code.IN_USE,
                "Global variable 'tenants' is used, so it cannot be deleted", 4L,
                List.of(new GlobalVariableConflictException.Blocking("WORKFLOW", 42L, "VMware to i-doit",
                        "METHOD", "List objects", "#ababab", "0_1", "endpoint", "IN_USE"))))
                .when(service).delete(7L);

        mockMvc.perform(delete("/global-variable/{id}", 7))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("GLOBAL_VARIABLE_CONFLICT"))
                .andExpect(jsonPath("$.code").value("IN_USE"))
                .andExpect(jsonPath("$.currentVersion").value(4))
                .andExpect(jsonPath("$.blocking.length()").value(1))
                .andExpect(jsonPath("$.blocking[0].sourceType").value("WORKFLOW"))
                .andExpect(jsonPath("$.blocking[0].sourceId").value(42))
                .andExpect(jsonPath("$.blocking[0].sourceTitle").value("VMware to i-doit"))
                .andExpect(jsonPath("$.blocking[0].color").value("#ababab"))
                .andExpect(jsonPath("$.blocking[0].index").value("0_1"))
                .andExpect(jsonPath("$.blocking[0].reason").value("IN_USE"));
    }

    // ── GET /global-variable/{id}/usage ───────────────────────────────────────

    @Test
    void getUsagesReturnsUsageListWhenVariableIsUsed() throws Exception {
        when(service.getUsages(7L)).thenReturn(List.of(new GlobalVariableUsageDTO(
                GlobalVariableUsage.SourceType.WORKFLOW, 42L, "VMware to i-doit",
                GlobalVariableUsage.ElementType.METHOD, "List objects", "#ababab", "0_1", "body.filter.since",
                GlobalVariableUsage.Access.READ)));

        mockMvc.perform(get("/global-variable/{id}/usage", 7).accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].sourceType").value("WORKFLOW"))
                .andExpect(jsonPath("$[0].sourceId").value(42))
                .andExpect(jsonPath("$[0].sourceTitle").value("VMware to i-doit"))
                .andExpect(jsonPath("$[0].elementType").value("METHOD"))
                .andExpect(jsonPath("$[0].elementLabel").value("List objects"))
                .andExpect(jsonPath("$[0].color").value("#ababab"))
                .andExpect(jsonPath("$[0].index").value("0_1"))
                .andExpect(jsonPath("$[0].field").value("body.filter.since"))
                .andExpect(jsonPath("$[0].access").value("READ"));
    }

    // ── GET /global-variable/picker ───────────────────────────────────────────

    @Test
    void pickPassesTargetWhenConnectionIdIsGiven() throws Exception {
        when(service.pick(42L, null, null, null)).thenReturn(List.of(new GlobalVariablePickerItemDTO(
                "idoitUrl", GlobalVariableKind.CONSTANT, "Base URL of i-doit", false, "\"https://cmdb.example\"")));

        mockMvc.perform(get("/global-variable/picker").param("connectionId", "42").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("idoitUrl"))
                .andExpect(jsonPath("$[0].kind").value("CONSTANT"))
                .andExpect(jsonPath("$[0].secret").value(false))
                .andExpect(jsonPath("$[0].valuePreview").value("\"https://cmdb.example\""));

        verify(service).pick(42L, null, null, null);
    }

    // ── GET /global-variable/values ───────────────────────────────────────────

    @Test
    @DisplayName("getValues — the answer carries an ETag of ids and versions and is revalidated on every poll")
    void getValuesReturnsValuesWithEtagWhenRequestIsFirst() throws Exception {
        List<GlobalVariableValueDTO> values = List.of(aValueDto());
        when(service.getValues(List.of(7L))).thenReturn(values);

        mockMvc.perform(get("/global-variable/values").param("ids", "7").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ETAG, "\"" + GlobalVariableValueDTO.etagOf(values) + "\""))
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-cache"))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(7))
                .andExpect(jsonPath("$[0].version").value(4))
                .andExpect(jsonPath("$[0].value[0].id").value("acme"))
                .andExpect(jsonPath("$[0].updatedAt").value("2026-11-16T09:12:00Z"))
                .andExpect(jsonPath("$[0].updatedBy.name").value("admin"));
    }

    @Test
    @DisplayName("getValues — a poll that carries the tag of the last answer gets 304 and no body")
    void getValuesReturnsNotModifiedWhenEtagMatches() throws Exception {
        when(service.getValues(List.of(7L))).thenReturn(List.of(aValueDto()));
        String etag = mockMvc.perform(get("/global-variable/values").param("ids", "7"))
                .andReturn()
                .getResponse()
                .getHeader(HttpHeaders.ETAG);

        mockMvc.perform(get("/global-variable/values").param("ids", "7").header(HttpHeaders.IF_NONE_MATCH, etag))
                .andExpect(status().isNotModified())
                .andExpect(header().string(HttpHeaders.ETAG, etag))
                .andExpect(content().string(""));
    }

    @Test
    void getValuesReturnsValuesWhenEtagIsStale() throws Exception {
        when(service.getValues(List.of(7L))).thenReturn(List.of(aValueDto()));

        mockMvc.perform(get("/global-variable/values").param("ids", "7")
                        .header(HttpHeaders.IF_NONE_MATCH, "\"0123456789abcdef0123456789abcdef\""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].version").value(4));
    }

    @Test
    void getValuesPassesIdsWhenTheyAreCommaSeparated() throws Exception {
        mockMvc.perform(get("/global-variable/values").param("ids", "7,12").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        verify(service).getValues(List.of(7L, 12L));
    }

    // ── POST /global-variable/{id}/impact ─────────────────────────────────────

    @Test
    @DisplayName("impact — takes the body of the update form and answers 200 with what the save would refuse")
    void impactReturnsBlockingWhenChangeWouldBreakUsages() throws Exception {
        when(service.impact(eq(7L), any())).thenReturn(new GlobalVariableImpactDTO(
                List.of(new GlobalVariableConflictException.Blocking("WORKFLOW", 42L, "VMware to i-doit",
                        "METHOD", "List objects", "#ababab", "0_1", "endpoint", "IN_USE")),
                List.of()));

        mockMvc.perform(post("/global-variable/{id}/impact", 7)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.blocking.length()").value(1))
                .andExpect(jsonPath("$.blocking[0].sourceType").value("WORKFLOW"))
                .andExpect(jsonPath("$.blocking[0].sourceId").value(42))
                .andExpect(jsonPath("$.blocking[0].index").value("0_1"))
                .andExpect(jsonPath("$.blocking[0].reason").value("IN_USE"))
                .andExpect(jsonPath("$.warnings").isEmpty());

        verify(service).impact(7L, new GlobalVariableImpactDTO.Request(null, "tenants",
                new GlobalVariableRequestDTO.Scope(GlobalVariableScopeType.ALL, List.of(), List.of())));
    }

    // ── POST /global-variable/{id}/restore/{changeId} ─────────────────────────

    @Test
    void restoreReturnsVariableWhenEntryIsRestored() throws Exception {
        when(service.restore(eq(7L), eq(31L), any())).thenReturn(aDetailDto());

        mockMvc.perform(post("/global-variable/{id}/restore/{changeId}", 7, 31)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"version\": 4}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7))
                .andExpect(jsonPath("$.value[0].id").value("acme"))
                .andExpect(jsonPath("$.version").value(4));

        verify(service).restore(7L, 31L, new GlobalVariableRestoreRequestDTO(4L));
    }

    // ── POST /global-variable/{id}/reset ──────────────────────────────────────

    @Test
    void resetReturnsVariableWhenCurrentValueIsReset() throws Exception {
        when(service.reset(7L)).thenReturn(aDetailDto());

        mockMvc.perform(post("/global-variable/{id}/reset", 7))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7))
                .andExpect(jsonPath("$.version").value(4));

        verify(service).reset(7L);
    }

    @Test
    void resetReturnsBadRequestWhenVariableIsNotMutable() throws Exception {
        when(service.reset(7L)).thenThrow(new GlobalVariableValidationException(List.of(
                new Violation("id", Code.NOT_MUTABLE, "Global variable 'tenants' is a CONSTANT"))));

        mockMvc.perform(post("/global-variable/{id}/reset", 7))
                .andExpect(status().isBadRequest());
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private GlobalVariableValueDTO aValueDto() throws Exception {
        return new GlobalVariableValueDTO(7L, 4L, 0L, json.readTree("[{\"id\":\"acme\"}]"),
                Instant.parse("2026-11-16T09:12:00Z"), GlobalVariableDTO.Actor.user(1, "admin"), null);
    }

    private GlobalVariableDTO aDetailDto() throws Exception {
        return new GlobalVariableDTO(
                7L,
                "tenants",
                GlobalVariableKind.CONSTANT,
                "Tenants to sync",
                json.readTree("[{\"id\":\"acme\"}]"),
                false,
                true,
                null,
                new GlobalVariableDTO.Scope(GlobalVariableScopeType.ALL, List.of(), List.of()),
                new GlobalVariableDTO.UserRef(1, "admin"),
                EnumSet.of(GlobalVariablePermission.VIEW_USE),
                null,
                4L,
                Instant.parse("2026-11-02T09:00:00Z"),
                GlobalVariableDTO.Actor.user(1, "admin"),
                Instant.parse("2026-11-16T09:12:00Z"),
                GlobalVariableDTO.Actor.user(1, "admin"));
    }
}

package com.becon.opencelium.backend.unit.globalvariable;

import static org.assertj.core.api.Assertions.assertThat;

import com.becon.opencelium.backend.controller.GlobalVariableController;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Verifies that every endpoint of {@link GlobalVariableController} asks for the intended
 * permission on the {@code GLOBAL_VARIABLE} component. Enforcement at runtime is provided by
 * Spring's method security AOP, which a {@code @WebMvcTest} slice does not load; the rule itself
 * is covered by {@code GlobalVariableSecurityTest}.
 *
 * <p>Run with: ./gradlew test --tests "*.GlobalVariableControllerSecurityAnnotationsTest"
 */
@DisplayName("GlobalVariableController — security annotations")
class GlobalVariableControllerSecurityAnnotationsTest {

    @ParameterizedTest(name = "[{index}] {0} needs {1}")
    @CsvSource({
            "getAll,            READ",
            "get,               READ",
            "isNameUnique,      READ",
            "getPermissions,    READ",
            "getChanges,        READ",
            "getUsages,         READ",
            "pick,              READ",
            "getValues,         READ",
            "create,            CREATE",
            "update,            UPDATE",
            "updatePermissions, UPDATE",
            "restore,           UPDATE",
            "reset,             UPDATE",
            "delete,            DELETE",
    })
    void endpointRequiresComponentPermissionWhenCalled(String methodName, String permission) {
        PreAuthorize preAuthorize = endpoint(methodName).getAnnotation(PreAuthorize.class);

        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value()).isEqualTo("@globalVariableSecurity.can('" + permission + "')");
    }

    @Test
    @DisplayName("impact — previews a change or a delete, so either permission opens it")
    void impactRequiresUpdateOrDeletePermissionWhenCalled() {
        PreAuthorize preAuthorize = endpoint("impact").getAnnotation(PreAuthorize.class);

        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value())
                .isEqualTo("@globalVariableSecurity.can('UPDATE') or @globalVariableSecurity.can('DELETE')");
    }

    @Test
    @DisplayName("every public endpoint carries a @PreAuthorize rule, so a new one cannot be left open")
    void everyEndpointIsProtectedWhenControllerIsScanned() {
        List<Method> unprotected = Arrays.stream(GlobalVariableController.class.getDeclaredMethods())
                .filter(method -> Modifier.isPublic(method.getModifiers()))
                .filter(method -> !method.isSynthetic())
                .filter(method -> method.getAnnotation(PreAuthorize.class) == null)
                .toList();

        assertThat(unprotected).isEmpty();
        assertThat(GlobalVariableController.class.getAnnotation(RequestMapping.class).value())
                .containsExactly("/global-variable");
    }

    private static Method endpoint(String name) {
        return Arrays.stream(GlobalVariableController.class.getDeclaredMethods())
                .filter(method -> method.getName().equals(name))
                .findFirst()
                .orElseThrow(() -> new AssertionError("No endpoint method named " + name));
    }
}

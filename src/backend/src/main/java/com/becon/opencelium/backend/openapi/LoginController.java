package com.becon.opencelium.backend.openapi;

import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.resource.schedule.SchedulerResource;
import com.becon.opencelium.backend.resource.user.UserResource;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.headers.Header;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;



// This controller was created only for openapi documentation.
@RestController
@Tag(name = "# Authorization", description = "Authorizes user")
public class LoginController {
    @Operation(summary = "Authorizes user and send in header JWT token")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Success",
                    headers = @Header(name = "Authorization", description = "Generated token"),
                    content = @Content(schema = @Schema(implementation = UserResource.class))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @ConditionalOnExpression("false")
    @PostMapping(value = "/login", produces = "application/json", consumes = "application/json")
    public ResponseEntity<UserResource> login(@RequestBody UserCredentialDTO userCredentialDTO) {
        return ResponseEntity.ok().build();
    }

}

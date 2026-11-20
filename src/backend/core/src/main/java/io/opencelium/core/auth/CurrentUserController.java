package io.opencelium.core.auth;

import java.util.List;
import java.util.TreeSet;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import io.opencelium.core.user.UserService;

/**
 * The data of the current OpenCelium user: the user of the session JWT of the request. The roles are those of the
 * session JWT. The response never holds the password hash. A user that no longer exists gets the status code 401,
 * as a request without a login: the HTTP client then logs in again.
 */
@RestController
final class CurrentUserController {

	static final String PATH = "/api/auth/me";

	private final UserService users;

	CurrentUserController(UserService users) {
		this.users = users;
	}

	@GetMapping(PATH)
	ResponseEntity<CurrentUser> me(@AuthenticationPrincipal UserPrincipal principal) {
		return users.findById(principal.userId())
				.map(user -> ResponseEntity.ok(new CurrentUser(user.id(), user.username(),
						principal.tenantId().value(), List.copyOf(new TreeSet<>(principal.roles())))))
				.orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
	}

	record CurrentUser(String id, String username, String tenantId, List<String> roles) {

		CurrentUser {
			roles = List.copyOf(roles);
		}

	}

}

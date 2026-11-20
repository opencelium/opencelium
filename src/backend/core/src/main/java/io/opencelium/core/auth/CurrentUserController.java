package io.opencelium.core.auth;

import java.util.List;
import java.util.TreeSet;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import io.opencelium.core.user.UserDocument;
import io.opencelium.core.user.UserService;

/**
 * The data of the current OpenCelium user: the user of the session JWT of the request. The roles are those of the
 * session JWT. The response never holds the password hash. A user that does not exist any more gets the error
 * response {@code session-ended}, as a refresh of that session does: the HTTP client then logs in again. The log gets
 * 1 line with the IDs of the user and of the session, never with a token. The session record stays; the next refresh
 * deletes it.
 */
@RestController
final class CurrentUserController {

	static final String PATH = "/api/auth/me";

	private static final Log log = LogFactory.getLog(CurrentUserController.class);

	private final UserService users;

	CurrentUserController(UserService users) {
		this.users = users;
	}

	/** @throws SessionEndedException when the user does not exist any more; {@link #sessionEnded} answers */
	@GetMapping(PATH)
	ResponseEntity<CurrentUser> me(@AuthenticationPrincipal UserPrincipal principal) {
		UserDocument user = users.findById(principal.userId())
				.orElseThrow(() -> new SessionEndedException("the OpenCelium user " + principal.userId()
						+ " of the session " + principal.sessionId() + " does not exist"));
		return ResponseEntity.ok(new CurrentUser(user.id(), user.username(), user.email(),
				principal.tenantId().value(), List.copyOf(new TreeSet<>(principal.roles()))));
	}

	@ExceptionHandler(SessionEndedException.class)
	ResponseEntity<ProblemDetail> sessionEnded(SessionEndedException ended) {
		log.info("A request for the current user failed with the code " + AuthError.SESSION_ENDED.code() + ": "
				+ ended.getMessage() + ".");
		return AuthError.SESSION_ENDED.response();
	}

	/** @param email the email in lower case, or {@code null} when the user has none */
	record CurrentUser(String id, String username, String email, String tenantId, List<String> roles) {

		CurrentUser {
			roles = List.copyOf(roles);
		}

	}

}

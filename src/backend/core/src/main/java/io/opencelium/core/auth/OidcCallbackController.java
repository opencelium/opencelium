package io.opencelium.core.auth;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * The redirect URI of an OIDC provider: the IdP sends the browser here with its answer to a login. Core redirects the
 * browser to the login page of the frontend, with the login code of the new session or with an error code after the
 * {@code #}. The target is a path of the origin of core without a host, nothing of the request changes it, and the
 * redirect has no body.
 */
@RestController
class OidcCallbackController {

	private final OidcLoginCompletion completion;

	OidcCallbackController(OidcLoginCompletion completion) {
		this.completion = completion;
	}

	@GetMapping(OidcLoginController.CALLBACK_PATH)
	ResponseEntity<Void> callback(@PathVariable("providerId") String providerId,
			@RequestParam(name = "state", required = false) String state,
			@RequestParam(name = "code", required = false) String code,
			@RequestParam(name = "error", required = false) String error, HttpServletRequest request) {
		throw new UnsupportedOperationException("Not implemented yet.");
	}

}

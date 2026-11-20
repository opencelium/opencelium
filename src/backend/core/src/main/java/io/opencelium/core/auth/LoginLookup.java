package io.opencelium.core.auth;

import org.springframework.core.convert.ConversionException;
import org.springframework.data.mapping.MappingException;
import org.springframework.data.mapping.model.MappingInstantiationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import io.opencelium.core.user.UserService;

/**
 * Finds the OpenCelium user of the name of a login, in the current tenant. The name is compared with the username
 * exactly. The error of a name that no user has does not repeat the name: a person can type a password into the
 * field of the name.
 */
final class LoginLookup implements UserDetailsService {

	private final UserService users;

	LoginLookup(UserService users) {
		this.users = users;
	}

	/**
	 * @throws UsernameNotFoundException when no user of the current tenant has this name
	 * @throws IllegalStateException     when the stored user is damaged: it lacks fields or has fields of the wrong
	 *                                   type
	 */
	@Override
	public UserDetails loadUserByUsername(String name) {
		try {
			return users.findByUsername(name).map(LoginUser::of)
					.orElseThrow(() -> new UsernameNotFoundException("No OpenCelium user has this name."));
		}
		catch (MappingInstantiationException | MappingException | ConversionException ex) {
			// Not the exception's message or cause: they can quote the values of the document, the password hash too.
			throw new IllegalStateException("The stored OpenCelium user of a login is damaged: it lacks fields or has"
					+ " fields of the wrong type.");
		}
	}

}

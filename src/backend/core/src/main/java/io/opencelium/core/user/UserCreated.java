package io.opencelium.core.user;

/** Result of {@link UserService#createAdmin}: never the password. */
public record UserCreated(String id, String username) {
}

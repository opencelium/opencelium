package com.becon.opencelium.backend.unit.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.database.mysql.repository.UserRepository;
import com.becon.opencelium.backend.database.mysql.service.UserServiceImpl;
import com.becon.opencelium.backend.enums.AuthMethod;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceImplTest {
    @Mock
    UserRepository userRepository;

    @Mock
    PasswordEncoder passwordEncoder;

//    @Mock
//    CurrentUserProvider currentUserProvider;

    @InjectMocks
    UserServiceImpl userService;

    @Test
    void findByEmail_returnsUserWhenExists() {
        User user = new User();
        user.setEmail("a@b.com");

        when(userRepository.findByEmail("a@b.com")).thenReturn(Optional.of(user));

        Optional<User> result = userService.findByEmail("a@b.com");

        assertThat(result).contains(user);
        verify(userRepository).findByEmail("a@b.com");
        verifyNoMoreInteractions(userRepository);
    }

    @Test
    void findByUsername_returnsUser_whenExists() {
        User user = new User();
        user.setUsername("bob");

        when(userRepository.findByUsernameAndAuthMethod("bob", AuthMethod.LDAP))
                .thenReturn(Optional.of(user));

        Optional<User> result = userService.findByUsername("bob");

        assertThat(result).isPresent();
        assertThat(result.get().getUsername()).isEqualTo("bob");

        verify(userRepository).findByUsernameAndAuthMethod("bob", AuthMethod.LDAP);
        verifyNoMoreInteractions(userRepository);
    }

    @Test
    void findByUsername_returnsEmpty_whenNotExists() {
        when(userRepository.findByUsernameAndAuthMethod("missing", AuthMethod.LDAP))
                .thenReturn(Optional.empty());

        Optional<User> result = userService.findByUsername("missing");

        assertThat(result).isEmpty();

        verify(userRepository).findByUsernameAndAuthMethod("missing", AuthMethod.LDAP);
        verifyNoMoreInteractions(userRepository);
    }

    @Test
    void findById_returnsUser_whenExists() {
        User user = new User();
        user.setId(7);

        when(userRepository.findOneById(7)).thenReturn(Optional.of(user));

        Optional<User> result = userService.findById(7);

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(7);

        verify(userRepository).findOneById(7);
        verifyNoMoreInteractions(userRepository);
    }

    @Test
    void findById_returnsEmpty_whenNotExists() {
        when(userRepository.findOneById(999)).thenReturn(Optional.empty());

        Optional<User> result = userService.findById(999);

        assertThat(result).isEmpty();

        verify(userRepository).findOneById(999);
        verifyNoMoreInteractions(userRepository);
    }

    @Test
    void getById_returnsUser_whenFound() {
        User user = new User();
        user.setId(5);

        when(userRepository.findOneById(5)).thenReturn(Optional.of(user));

        User result = userService.getById(5);

        assertThat(result.getId()).isEqualTo(5);

        verify(userRepository).findOneById(5);
        verifyNoMoreInteractions(userRepository);
    }

    @Test
    void getById_whenNotFound_printsThrownType() {
        when(userRepository.findOneById(123)).thenReturn(Optional.empty());

        Throwable thrown = catchThrowable(() -> userService.getById(123));

        System.out.println("Thrown: " + (thrown == null ? "null (no exception)" : thrown.getClass().getName()));
        if (thrown != null) {
            System.out.println("Message: " + thrown.getMessage());
        }

        assertThat(thrown).as("getById(123) should throw when user not found").isNotNull();
    }

    @Test
    void save_callsRepository_andReturnsSavedUser_whenEmailIsValid() {
        User input = new User();
        input.setEmail("bob@example.com"); // must be valid for EmailUtility.isEmail(...)

        User saved = new User();
        saved.setId(10);
        saved.setEmail("bob@example.com");

        when(userRepository.save(input)).thenReturn(saved);

        User result = userService.save(input);

        assertThat(result.getId()).isEqualTo(10);
        assertThat(result.getEmail()).isEqualTo("bob@example.com");

        verify(userRepository).save(input);
        verifyNoMoreInteractions(userRepository);
    }

    @Test
    void save_throwsIllegalArgumentException_andDoesNotCallRepository_whenEmailIsInvalid() {
        User input = new User();
        input.setEmail("not-an-email"); // invalid -> should throw

        assertThatThrownBy(() -> userService.save(input))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Invalid email is supplied to User dto");

        verifyNoInteractions(userRepository);
    }
}

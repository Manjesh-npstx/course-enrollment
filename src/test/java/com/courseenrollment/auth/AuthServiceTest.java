package com.courseenrollment.auth;

import com.courseenrollment.auth.dto.AuthResponse;
import com.courseenrollment.auth.dto.LoginRequest;
import com.courseenrollment.auth.dto.RegisterRequest;
import com.courseenrollment.auth.entity.User;
import com.courseenrollment.auth.enums.UserRole;
import com.courseenrollment.auth.repository.UserRepository;
import com.courseenrollment.auth.service.AuthService;
import com.courseenrollment.common.exception.ConflictException;
import com.courseenrollment.config.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private JwtService jwtService;
    private AuthService authService;
    private User mockUser;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService("course-enrollment-secret-key-that-is-at-least-256-bits-long-for-hmac-sha256", 86400000L);
        authService = new AuthService(userRepository, passwordEncoder, jwtService);

        mockUser = new User("admin@test.com", "Admin", "$2a$10$hashed", UserRole.ADMIN);
        mockUser.setId(1L);
    }

    @Test
    @DisplayName("register should create user and return JWT token")
    void register_success() {
        RegisterRequest req = new RegisterRequest("Admin", "admin@test.com", "pass123");
        when(userRepository.existsByEmail("admin@test.com")).thenReturn(false);
        when(passwordEncoder.encode("pass123")).thenReturn("$2a$10$hashed");
        when(userRepository.save(any(User.class))).thenReturn(mockUser);

        AuthResponse res = authService.register(req);

        assertThat(res).isNotNull();
        assertThat(res.getUser().getName()).isEqualTo("Admin");
        assertThat(res.getUser().getEmail()).isEqualTo("admin@test.com");
        assertThat(res.getToken()).isNotBlank();
        assertThat(jwtService.isTokenValid(res.getToken())).isTrue();
        assertThat(jwtService.extractEmail(res.getToken())).isEqualTo("admin@test.com");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("register should throw ConflictException on duplicate email")
    void register_duplicateEmail() {
        RegisterRequest req = new RegisterRequest("Dup", "admin@test.com", "pass123");
        when(userRepository.existsByEmail("admin@test.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Email already registered");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("login should return user and token on valid credentials")
    void login_success() {
        LoginRequest req = new LoginRequest("admin@test.com", "pass123");
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("pass123", "$2a$10$hashed")).thenReturn(true);

        AuthResponse res = authService.login(req);

        assertThat(res).isNotNull();
        assertThat(res.getUser().getEmail()).isEqualTo("admin@test.com");
        assertThat(res.getToken()).isNotBlank();
        assertThat(jwtService.isTokenValid(res.getToken())).isTrue();
    }

    @Test
    @DisplayName("login should throw BadCredentialsException for unknown email")
    void login_unknownEmail() {
        LoginRequest req = new LoginRequest("unknown@test.com", "pass123");
        when(userRepository.findByEmail("unknown@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid credentials");
    }

    @Test
    @DisplayName("login should throw BadCredentialsException for wrong password")
    void login_wrongPassword() {
        LoginRequest req = new LoginRequest("admin@test.com", "wrongpass");
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("wrongpass", "$2a$10$hashed")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid credentials");
    }
}

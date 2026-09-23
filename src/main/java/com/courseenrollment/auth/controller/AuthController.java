package com.courseenrollment.auth.controller;

import com.courseenrollment.auth.dto.AuthResponse;
import com.courseenrollment.auth.dto.LoginRequest;
import com.courseenrollment.auth.dto.RegisterRequest;
import com.courseenrollment.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Auth")
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new user")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        AuthResponse response = authService.register(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Login and receive JWT token")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        AuthResponse response = authService.login(req);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/switch-role")
    @Operation(summary = "Switch the current authenticated user's role between admin and student")
    public ResponseEntity<AuthResponse> switchRole(
            @RequestBody(required = false) java.util.Map<String, String> body,
            org.springframework.security.core.Authentication auth
    ) {
        String role = body != null ? body.get("role") : null;
        String email = auth != null ? auth.getName() : null;
        if (email == null) {
            throw new org.springframework.security.authentication.BadCredentialsException("Not authenticated");
        }
        AuthResponse response = authService.switchRole(email, role);
        return ResponseEntity.ok(response);
    }
}

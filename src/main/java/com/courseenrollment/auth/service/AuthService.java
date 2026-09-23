package com.courseenrollment.auth.service;

import com.courseenrollment.auth.dto.AuthResponse;
import com.courseenrollment.auth.dto.LoginRequest;
import com.courseenrollment.auth.dto.RegisterRequest;
import com.courseenrollment.auth.dto.UserDto;
import com.courseenrollment.auth.entity.User;
import com.courseenrollment.auth.enums.UserRole;
import com.courseenrollment.auth.repository.UserRepository;
import com.courseenrollment.common.exception.ConflictException;
import com.courseenrollment.config.JwtService;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new ConflictException("Email already registered");
        }

        UserRole role;
        if (req.getRole() != null && !req.getRole().trim().isEmpty()) {
            role = UserRole.fromValue(req.getRole().trim());
        } else {
            // Default to ADMIN so all users can manage courses and students immediately
            role = UserRole.ADMIN;
        }

        String hashedPassword = passwordEncoder.encode(req.getPassword());
        User user = new User(req.getEmail().trim(), req.getName().trim(), hashedPassword, role);
        User savedUser = userRepository.save(user);

        String token = jwtService.generateToken(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getRole().getValue()
        );

        return new AuthResponse(UserDto.fromEntity(savedUser), token);
    }

    @Transactional
    public AuthResponse switchRole(String email, String targetRole) {
        User user = userRepository.findByEmail(email.trim())
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        UserRole newRole = (targetRole != null && !targetRole.trim().isEmpty())
                ? UserRole.fromValue(targetRole.trim())
                : (user.getRole() == UserRole.ADMIN ? UserRole.STUDENT : UserRole.ADMIN);

        user.setRole(newRole);
        User savedUser = userRepository.save(user);

        String token = jwtService.generateToken(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getRole().getValue()
        );

        return new AuthResponse(UserDto.fromEntity(savedUser), token);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail().trim())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        String token = jwtService.generateToken(
                user.getId(),
                user.getEmail(),
                user.getRole().getValue()
        );

        return new AuthResponse(UserDto.fromEntity(user), token);
    }
}

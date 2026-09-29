package com.courseenrollment.config;

import com.courseenrollment.auth.entity.User;
import com.courseenrollment.auth.enums.UserRole;
import com.courseenrollment.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!userRepository.existsByEmail("admin@campus.com")) {
            String hashed = passwordEncoder.encode("admin123");
            User admin = new User("admin@campus.com", "Admin", hashed, UserRole.ADMIN);
            userRepository.save(admin);
            log.info("Seeded admin account: admin@campus.com / admin123");
        }

        if (!userRepository.existsByEmail("instructor@campus.com")) {
            String hashed = passwordEncoder.encode("instructor123");
            User instructor = new User("instructor@campus.com", "Dr. Jane Instructor", hashed, UserRole.INSTRUCTOR);
            userRepository.save(instructor);
            log.info("Seeded instructor account: instructor@campus.com / instructor123");
        }

        if (!userRepository.existsByEmail("student@campus.com")) {
            String hashed = passwordEncoder.encode("student123");
            User student = new User("student@campus.com", "Alice Student", hashed, UserRole.STUDENT);
            userRepository.save(student);
            log.info("Seeded student account: student@campus.com / student123");
        }
    }
}

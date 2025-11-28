package io.github.beom.features.user;

import io.github.beom.domain.model.AggregateRoot;
import lombok.Getter;

/**
 * User aggregate root (DDD)
 */
@Getter
public class User extends AggregateRoot<Long> {
    private String email;
    private String name;
    private UserStatus status;

    private User(Long id, String email, String name, UserStatus status) {
        super(id);
        this.email = email;
        this.name = name;
        this.status = status;
    }

    public static User create(String email, String name) {
        validateEmail(email);
        validateName(name);
        return new User(null, email, name, UserStatus.ACTIVE);
    }

    public static User reconstruct(Long id, String email, String name, UserStatus status) {
        return new User(id, email, name, status);
    }

    public void updateProfile(String name) {
        validateName(name);
        this.name = name;
    }

    public void deactivate() {
        this.status = UserStatus.INACTIVE;
    }

    public void activate() {
        this.status = UserStatus.ACTIVE;
    }

    private static void validateEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email cannot be empty");
        }
        if (!email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new IllegalArgumentException("Invalid email format");
        }
    }

    private static void validateName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Name cannot be empty");
        }
        if (name.length() > 100) {
            throw new IllegalArgumentException("Name is too long");
        }
    }
}

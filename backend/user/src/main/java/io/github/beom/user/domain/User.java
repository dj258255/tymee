package io.github.beom.user.domain;

import io.github.beom.domain.model.AggregateRoot;
import lombok.Getter;

/**
 * User 애그리게이트 루트 (DDD)
 */
@Getter
public class User extends AggregateRoot<Long> {
    private String email;
    private String password;  // 암호화된 비밀번호
    private String name;
    private UserStatus status;
    private AuthProvider authProvider;  // 인증 제공자 (LOCAL, KAKAO)
    private String providerId;  // OAuth 제공자의 사용자 ID

    private User(Long id, String email, String password, String name, UserStatus status, AuthProvider authProvider, String providerId) {
        super(id);
        this.email = email;
        this.password = password;
        this.name = name;
        this.status = status;
        this.authProvider = authProvider;
        this.providerId = providerId;
    }

    public static User create(String email, String encodedPassword, String name) {
        validateEmail(email);
        validatePassword(encodedPassword);
        validateName(name);
        return new User(null, email, encodedPassword, name, UserStatus.ACTIVE, AuthProvider.LOCAL, null);
    }

    public static User createOAuthUser(String email, String name, AuthProvider authProvider, String providerId) {
        validateEmail(email);
        validateName(name);
        if (authProvider == null || authProvider == AuthProvider.LOCAL) {
            throw new IllegalArgumentException("OAuth provider is required");
        }
        if (providerId == null || providerId.isBlank()) {
            throw new IllegalArgumentException("Provider ID is required for OAuth users");
        }
        return new User(null, email, null, name, UserStatus.ACTIVE, authProvider, providerId);
    }

    public static User reconstruct(Long id, String email, String password, String name, UserStatus status, AuthProvider authProvider, String providerId) {
        return new User(id, email, password, name, status, authProvider, providerId);
    }

    // Legacy reconstruct method for backward compatibility
    public static User reconstruct(Long id, String email, String password, String name, UserStatus status) {
        return new User(id, email, password, name, status, AuthProvider.LOCAL, null);
    }

    public void changePassword(String newEncodedPassword) {
        validatePassword(newEncodedPassword);
        this.password = newEncodedPassword;
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

    private static void validatePassword(String password) {
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("Password cannot be empty");
        }
    }

    public boolean isOAuthUser() {
        return authProvider != null && authProvider != AuthProvider.LOCAL;
    }

    public boolean isLocalUser() {
        return authProvider == AuthProvider.LOCAL;
    }
}
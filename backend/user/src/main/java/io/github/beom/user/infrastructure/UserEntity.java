package io.github.beom.user.infrastructure;

import io.github.beom.infrastructure.persistence.BaseEntity;
import io.github.beom.user.domain.AuthProvider;
import io.github.beom.user.domain.User;
import io.github.beom.user.domain.UserStatus;
import jakarta.persistence.*;
import lombok.*;

/**
 * User JPA 엔티티 (인프라 레이어 어댑터)
 */
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_provider_provider_id", columnList = "auth_provider,provider_id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class UserEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password", length = 255)
    private String password;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private UserStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "auth_provider", nullable = false, length = 20)
    @Builder.Default
    private AuthProvider authProvider = AuthProvider.LOCAL;

    @Column(name = "provider_id", length = 255)
    private String providerId;

    public static UserEntity from(User user) {
        return UserEntity.builder()
            .id(user.getId())
            .email(user.getEmail())
            .password(user.getPassword())
            .name(user.getName())
            .status(user.getStatus())
            .authProvider(user.getAuthProvider())
            .providerId(user.getProviderId())
            .build();
    }

    public User toDomain() {
        return User.reconstruct(id, email, password, name, status, authProvider, providerId);
    }

    public void updateFrom(User user) {
        this.email = user.getEmail();
        this.password = user.getPassword();
        this.name = user.getName();
        this.status = user.getStatus();
        this.authProvider = user.getAuthProvider();
        this.providerId = user.getProviderId();
    }
}
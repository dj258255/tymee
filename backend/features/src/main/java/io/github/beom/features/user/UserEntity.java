package io.github.beom.features.user;

import io.github.beom.infrastructure.persistence.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * JPA entity for User (Infrastructure layer adapter)
 */
@Entity
@Table(name = "users")
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

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private UserStatus status;

    public static UserEntity from(User user) {
        return UserEntity.builder()
            .id(user.getId())
            .email(user.getEmail())
            .name(user.getName())
            .status(user.getStatus())
            .build();
    }

    public User toDomain() {
        return User.reconstruct(id, email, name, status);
    }

    public void updateFrom(User user) {
        this.email = user.getEmail();
        this.name = user.getName();
        this.status = user.getStatus();
    }
}

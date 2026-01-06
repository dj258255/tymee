package io.github.beom.user.entity;

import io.github.beom.user.domain.UserDevice;
import io.github.beom.user.domain.vo.DevicePlatform;
import io.github.beom.user.entity.converter.DevicePlatformConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * 사용자 디바이스 JPA 엔티티.
 *
 * <p>user_id + device_id에 유니크 제약조건을 걸어 같은 디바이스 중복 등록 방지. 사용자별 디바이스 조회를 위해 user_id에 인덱스 추가.
 */
@Entity
@Table(
    name = "user_devices",
    uniqueConstraints = {
      @UniqueConstraint(
          name = "uk_user_devices_user_device",
          columnNames = {"user_id", "device_id"})
    },
    indexes = {@Index(name = "idx_user_devices_user_id", columnList = "user_id")})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserDeviceEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "user_id", nullable = false)
  private Long userId;

  @Column(name = "device_id", nullable = false)
  private String deviceId;

  @Column(name = "device_type", nullable = false, length = 20)
  @Convert(converter = DevicePlatformConverter.class)
  private DevicePlatform deviceType;

  @Column(name = "push_token", length = 500)
  private String pushToken;

  @Column(name = "app_version", length = 20)
  private String appVersion;

  @Column(name = "os_version", length = 20)
  private String osVersion;

  @Column(name = "is_active")
  private Boolean isActive;

  @Column(name = "last_used_at")
  private LocalDateTime lastUsedAt;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  @Builder
  public UserDeviceEntity(
      Long id,
      Long userId,
      String deviceId,
      DevicePlatform deviceType,
      String pushToken,
      String appVersion,
      String osVersion,
      Boolean isActive,
      LocalDateTime lastUsedAt,
      LocalDateTime createdAt,
      LocalDateTime updatedAt) {
    this.id = id;
    this.userId = userId;
    this.deviceId = deviceId;
    this.deviceType = deviceType;
    this.pushToken = pushToken;
    this.appVersion = appVersion;
    this.osVersion = osVersion;
    this.isActive = isActive;
    this.lastUsedAt = lastUsedAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /** 도메인 모델을 엔티티로 변환한다. */
  public static UserDeviceEntity from(UserDevice userDevice) {
    return UserDeviceEntity.builder()
        .id(userDevice.getId())
        .userId(userDevice.getUserId())
        .deviceId(userDevice.getDeviceId())
        .deviceType(userDevice.getDeviceType())
        .pushToken(userDevice.getPushToken())
        .appVersion(userDevice.getAppVersion())
        .osVersion(userDevice.getOsVersion())
        .isActive(userDevice.getIsActive())
        .lastUsedAt(userDevice.getLastUsedAt())
        .createdAt(userDevice.getCreatedAt())
        .updatedAt(userDevice.getUpdatedAt())
        .build();
  }

  /** 엔티티를 도메인 모델로 변환한다. */
  public UserDevice toDomain() {
    return UserDevice.builder()
        .id(id)
        .userId(userId)
        .deviceId(deviceId)
        .deviceType(deviceType)
        .pushToken(pushToken)
        .appVersion(appVersion)
        .osVersion(osVersion)
        .isActive(isActive)
        .lastUsedAt(lastUsedAt)
        .createdAt(createdAt)
        .updatedAt(updatedAt)
        .build();
  }

  /** 푸시 토큰을 업데이트한다. */
  public void updatePushToken(String pushToken) {
    this.pushToken = pushToken;
    this.lastUsedAt = LocalDateTime.now();
  }
}

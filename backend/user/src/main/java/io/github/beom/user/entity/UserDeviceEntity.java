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

  @Column(name = "fcm_token", nullable = false)
  private String fcmToken;

  @Column(name = "platform", nullable = false, length = 10)
  @Convert(converter = DevicePlatformConverter.class)
  private DevicePlatform platform;

  @Column(name = "device_id", nullable = false)
  private String deviceId;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  @Builder
  public UserDeviceEntity(
      Long id,
      Long userId,
      String fcmToken,
      DevicePlatform platform,
      String deviceId,
      LocalDateTime createdAt,
      LocalDateTime updatedAt) {
    this.id = id;
    this.userId = userId;
    this.fcmToken = fcmToken;
    this.platform = platform;
    this.deviceId = deviceId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /** 도메인 모델을 엔티티로 변환한다. */
  public static UserDeviceEntity from(UserDevice userDevice) {
    return UserDeviceEntity.builder()
        .id(userDevice.getId())
        .userId(userDevice.getUserId())
        .fcmToken(userDevice.getFcmToken())
        .platform(userDevice.getPlatform())
        .deviceId(userDevice.getDeviceId())
        .createdAt(userDevice.getCreatedAt())
        .updatedAt(userDevice.getUpdatedAt())
        .build();
  }

  /** 엔티티를 도메인 모델로 변환한다. */
  public UserDevice toDomain() {
    return UserDevice.builder()
        .id(id)
        .userId(userId)
        .fcmToken(fcmToken)
        .platform(platform)
        .deviceId(deviceId)
        .createdAt(createdAt)
        .updatedAt(updatedAt)
        .build();
  }

  /** FCM 토큰을 업데이트한다. */
  public void updateFcmToken(String fcmToken) {
    this.fcmToken = fcmToken;
  }
}

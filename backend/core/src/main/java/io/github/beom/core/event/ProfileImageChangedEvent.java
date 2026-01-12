package io.github.beom.core.event;

/**
 * 프로필 이미지 변경 이벤트. 이전 이미지 ID를 담아서 Upload 모듈에서 soft delete 처리.
 *
 * @param oldProfileImageId 이전 프로필 이미지의 publicId
 */
public record ProfileImageChangedEvent(Long oldProfileImageId) {}

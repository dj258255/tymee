package io.github.beom.upload.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/** 업로드 용도 분류. */
@Getter
@RequiredArgsConstructor
public enum UploadCategory {
  PROFILE("profiles"),
  POST("posts"),
  CHAT("chat");

  private final String path;

  public static UploadCategory fromCode(String code) {
    for (UploadCategory category : values()) {
      if (category.path.equals(code)) {
        return category;
      }
    }
    throw new IllegalArgumentException("Unknown upload category: " + code);
  }
}

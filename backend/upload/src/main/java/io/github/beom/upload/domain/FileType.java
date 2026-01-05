package io.github.beom.upload.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum FileType {
  IMAGE("image"),
  VIDEO("video"),
  AUDIO("audio");

  private final String code;

  public static FileType fromCode(String code) {
    for (FileType type : values()) {
      if (type.code.equals(code)) {
        return type;
      }
    }
    throw new IllegalArgumentException("Unknown file type: " + code);
  }

  public static FileType fromMimeType(String mimeType) {
    if (mimeType == null) {
      throw new IllegalArgumentException("MIME type cannot be null");
    }
    if (mimeType.startsWith("image/")) {
      return IMAGE;
    }
    if (mimeType.startsWith("video/")) {
      return VIDEO;
    }
    if (mimeType.startsWith("audio/")) {
      return AUDIO;
    }
    throw new IllegalArgumentException("Unsupported MIME type: " + mimeType);
  }
}

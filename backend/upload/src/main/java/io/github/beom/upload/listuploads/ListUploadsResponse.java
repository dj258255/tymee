package io.github.beom.upload.listuploads;

import io.github.beom.upload.domain.Upload;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 업로드 목록 조회 응답 DTO
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class ListUploadsResponse {
    private List<UploadItem> uploads;
    private int totalCount;

    @Getter
    @AllArgsConstructor
    public static class UploadItem {
        private Long id;
        private String originalFilename;
        private String contentType;
        private Long fileSize;
        private Instant uploadedAt;

        public static UploadItem from(Upload upload) {
            return new UploadItem(
                upload.getId(),
                upload.getOriginalFilename(),
                upload.getContentType(),
                upload.getFileSize(),
                upload.getUploadedAt()
            );
        }
    }

    public static ListUploadsResponse from(List<Upload> uploads) {
        List<UploadItem> items = uploads.stream()
            .map(UploadItem::from)
            .collect(Collectors.toList());

        return new ListUploadsResponse(items, items.size());
    }
}
package io.github.beom.upload.downloadupload;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * 파일 다운로드 REST Controller
 */
@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
public class DownloadUploadController {

    private final DownloadUploadHandler handler;

    /**
     * 파일 다운로드 엔드포인트
     * - 인증된 사용자만 다운로드 가능
     * - 자신이 업로드한 파일만 다운로드 가능
     */
    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(
        @PathVariable("id") Long id,
        Authentication authentication
    ) {
        Long userId = Long.parseLong(authentication.getName());
        FileResource fileResource = handler.handle(id, userId);

        // 파일명 인코딩 (한글 파일명 지원)
        String encodedFilename = encodeFilename(fileResource.getFilename());

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(fileResource.getContentType()))
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"" + encodedFilename + "\"")
            .body(fileResource.getResource());
    }

    private String encodeFilename(String filename) {
        try {
            return URLEncoder.encode(filename, StandardCharsets.UTF_8.toString())
                .replaceAll("\\+", "%20");
        } catch (UnsupportedEncodingException e) {
            return filename;
        }
    }
}
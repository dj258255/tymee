package io.github.beom.upload.downloadupload;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.core.io.Resource;

/**
 * 파일 리소스 DTO
 */
@Getter
@AllArgsConstructor
public class FileResource {
    private Resource resource;
    private String filename;
    private String contentType;
}
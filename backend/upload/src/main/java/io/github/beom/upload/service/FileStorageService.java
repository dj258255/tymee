package io.github.beom.upload.service;

import io.github.beom.core.exception.BusinessException;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * 파일 저장 서비스
 * 로컬 파일 시스템에 파일을 저장하고 관리
 */
@Service
public class FileStorageService {
    private static final Logger log = LogManager.getLogger(FileStorageService.class);

    private final Path uploadDirectory;

    public FileStorageService(@Value("${app.upload.directory:uploads}") String uploadDir) {
        this.uploadDirectory = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadDirectory);
            log.info("업로드 디렉토리 초기화: {}", this.uploadDirectory);
        } catch (IOException e) {
            throw new IllegalStateException("업로드 디렉토리를 생성할 수 없습니다: " + uploadDir, e);
        }
    }

    /**
     * 파일 저장
     *
     * @param file 업로드할 파일
     * @return 저장된 파일명 (UUID)
     */
    public String store(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BusinessException(io.github.beom.core.exception.ErrorCode.FILE_EMPTY);
        }

        // 원본 파일명 추출
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new BusinessException(io.github.beom.core.exception.ErrorCode.FILE_INVALID_NAME);
        }

        // 파일 확장자 추출
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalFilename.substring(dotIndex);
        }

        // UUID로 고유한 파일명 생성
        String storedFilename = UUID.randomUUID().toString() + extension;

        try {
            // 파일 저장 경로
            Path destinationFile = this.uploadDirectory.resolve(storedFilename).normalize();

            // 경로 순회 공격 방지
            if (!destinationFile.getParent().equals(this.uploadDirectory)) {
                throw new BusinessException(io.github.beom.core.exception.ErrorCode.FILE_INVALID_PATH);
            }

            // 파일 저장
            Files.copy(file.getInputStream(), destinationFile, StandardCopyOption.REPLACE_EXISTING);

            log.info("파일 저장 완료: {} -> {}", originalFilename, storedFilename);
            return storedFilename;

        } catch (IOException e) {
            log.error("파일 저장 실패: {}", originalFilename, e);
            throw new BusinessException(io.github.beom.core.exception.ErrorCode.FILE_STORE_FAILED, e.getMessage());
        }
    }

    /**
     * 파일 로드
     *
     * @param storedFilename 저장된 파일명
     * @return 파일 경로
     */
    public Path load(String storedFilename) {
        try {
            Path file = uploadDirectory.resolve(storedFilename).normalize();

            // 경로 순회 공격 방지
            if (!file.getParent().equals(this.uploadDirectory)) {
                throw new BusinessException(io.github.beom.core.exception.ErrorCode.FILE_INVALID_PATH);
            }

            if (!Files.exists(file)) {
                throw new BusinessException(io.github.beom.core.exception.ErrorCode.FILE_NOT_FOUND, storedFilename);
            }

            return file;

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("파일 로드 실패: {}", storedFilename, e);
            throw new BusinessException(io.github.beom.core.exception.ErrorCode.FILE_LOAD_FAILED, e.getMessage());
        }
    }

    /**
     * 파일 삭제
     *
     * @param storedFilename 저장된 파일명
     */
    public void delete(String storedFilename) {
        try {
            Path file = uploadDirectory.resolve(storedFilename).normalize();

            // 경로 순회 공격 방지
            if (!file.getParent().equals(this.uploadDirectory)) {
                throw new BusinessException(io.github.beom.core.exception.ErrorCode.FILE_INVALID_PATH);
            }

            Files.deleteIfExists(file);
            log.info("파일 삭제 완료: {}", storedFilename);

        } catch (IOException e) {
            log.error("파일 삭제 실패: {}", storedFilename, e);
            throw new BusinessException(io.github.beom.core.exception.ErrorCode.FILE_DELETE_FAILED, e.getMessage());
        }
    }

    /**
     * 업로드 디렉토리 경로 반환
     */
    public String getUploadDirectory() {
        return uploadDirectory.toString();
    }
}
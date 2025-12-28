package io.github.beom.core.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * JPA 엔티티 베이스 클래스 (감사 필드 포함)
 * - 생성일시/수정일시 자동 관리
 * - 낙관적 락킹을 위한 버전 필드
 */
@Getter
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseEntity {

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * 낙관적 락킹(Optimistic Locking)을 위한 버전 필드
     * 동시성 제어를 통해 데이터 무결성 보장
     */
    @Version
    @Column(name = "version")
    private Long version;
}

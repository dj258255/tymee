package io.github.beom.core.event;

import java.time.Instant;

/**
 * Base interface for domain events (DDD pattern)
 */
public interface DomainEvent {
    String getEventId();
    Instant getOccurredAt();
    String getAggregateId();
    String getEventType();
}

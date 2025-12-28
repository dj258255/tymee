package io.github.beom.core.domain;

import java.util.Optional;

/**
 * Base repository interface (DDD pattern)
 * This is a port in Clean Architecture
 */
public interface Repository<T extends AggregateRoot<ID>, ID> {
    Optional<T> findById(ID id);
    T save(T aggregate);
    void delete(T aggregate);
}

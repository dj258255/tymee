package io.github.beom.core.domain;

import lombok.EqualsAndHashCode;
import lombok.Getter;

import java.util.Objects;

/**
 * Base class for entities in DDD
 */
@Getter
@EqualsAndHashCode(of = "id")
public abstract class Entity<ID> {
    protected final ID id;

    protected Entity(ID id) {
        Objects.requireNonNull(id, "Entity ID cannot be null");
        this.id = id;
    }
}

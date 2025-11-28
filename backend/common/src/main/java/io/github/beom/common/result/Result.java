package io.github.beom.common.result;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.Optional;
import java.util.function.Function;

/**
 * Result type for functional error handling (Railway Oriented Programming)
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Result<T, E> {
    private final T value;
    private final E error;
    private final boolean isSuccess;

    public static <T, E> Result<T, E> success(T value) {
        return new Result<>(value, null, true);
    }

    public static <T, E> Result<T, E> failure(E error) {
        return new Result<>(null, error, false);
    }

    public Optional<T> getValue() {
        return Optional.ofNullable(value);
    }

    public Optional<E> getError() {
        return Optional.ofNullable(error);
    }

    public <U> Result<U, E> map(Function<T, U> mapper) {
        if (isSuccess) {
            return Result.success(mapper.apply(value));
        }
        return Result.failure(error);
    }

    public <U> Result<U, E> flatMap(Function<T, Result<U, E>> mapper) {
        if (isSuccess) {
            return mapper.apply(value);
        }
        return Result.failure(error);
    }
}

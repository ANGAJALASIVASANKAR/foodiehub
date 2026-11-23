package com.foodiehub.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    public ApiException(HttpStatus status, String message, String code) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public static ApiException badRequest(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, message, "BAD_REQUEST");
    }

    public static ApiException badRequest(String message, String code) {
        return new ApiException(HttpStatus.BAD_REQUEST, message, code);
    }

    public static ApiException notFound(String message) {
        return new ApiException(HttpStatus.NOT_FOUND, message, "NOT_FOUND");
    }

    public static ApiException conflict(String message, String code) {
        return new ApiException(HttpStatus.CONFLICT, message, code);
    }

    public static ApiException forbidden(String message) {
        return new ApiException(HttpStatus.FORBIDDEN, message, "FORBIDDEN");
    }

    public static ApiException unauthorized(String message) {
        return new ApiException(HttpStatus.UNAUTHORIZED, message, "UNAUTHORIZED");
    }
}

package com.insurai.backend.model;

public class ApiResponse<T> {
    private String message;
    private boolean success;
    private T data;

    public ApiResponse() {}

    public ApiResponse(String message, boolean success) {
        this.message = message;
        this.success = success;
    }

    public ApiResponse(String message, boolean success, T data) {
        this.message = message;
        this.success = success;
        this.data = data;
    }

    // Static factory methods
    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(message, true, data);
    }

    public static <T> ApiResponse<T> success(String message) {
        return new ApiResponse<>(message, true, null);
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(message, false, null);
    }

    // Getters
    public String getMessage() { return message; }
    public boolean isSuccess() { return success; }
    public T getData() { return data; }

    // Setters
    public void setMessage(String message) { this.message = message; }
    public void setSuccess(boolean success) { this.success = success; }
    public void setData(T data) { this.data = data; }
}

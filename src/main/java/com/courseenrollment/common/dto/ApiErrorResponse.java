package com.courseenrollment.common.dto;

public class ApiErrorResponse {
    private int statusCode;
    private Object message;
    private String error;

    public ApiErrorResponse() {
    }

    public ApiErrorResponse(int statusCode, Object message, String error) {
        this.statusCode = statusCode;
        this.message = message;
        this.error = error;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public void setStatusCode(int statusCode) {
        this.statusCode = statusCode;
    }

    public Object getMessage() {
        return message;
    }

    public void setMessage(Object message) {
        this.message = message;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }
}

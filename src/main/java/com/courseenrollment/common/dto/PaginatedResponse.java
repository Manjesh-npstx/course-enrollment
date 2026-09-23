package com.courseenrollment.common.dto;

import java.util.List;

public class PaginatedResponse<T> {
    private List<T> data;
    private PageMeta meta;

    public PaginatedResponse() {
    }

    public PaginatedResponse(List<T> data, PageMeta meta) {
        this.data = data;
        this.meta = meta;
    }

    public List<T> getData() {
        return data;
    }

    public void setData(List<T> data) {
        this.data = data;
    }

    public PageMeta getMeta() {
        return meta;
    }

    public void setMeta(PageMeta meta) {
        this.meta = meta;
    }
}

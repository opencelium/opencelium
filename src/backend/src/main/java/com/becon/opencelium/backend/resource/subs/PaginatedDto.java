package com.becon.opencelium.backend.resource.subs;

import com.becon.opencelium.backend.database.mysql.entity.OperationUsageHistory;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

public class PaginatedDto<T, D> {

    private List<D> content;
    private int currentPage;
    private int totalPages;
    private long totalItems;

    public PaginatedDto(Page<T> page, Function<T, D> converter) {
        this.content =  page.getContent().stream().map(converter).collect(Collectors.toList());
        this.currentPage = page.getNumber();
        this.totalPages = page.getTotalPages();
        this.totalItems = page.getTotalElements();
    }

    public List<D> getContent() {
        return content;
    }

    public void setContent(List<D> content) {
        this.content = content;
    }

    public int getCurrentPage() {
        return currentPage;
    }

    public void setCurrentPage(int currentPage) {
        this.currentPage = currentPage;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }

    public long getTotalItems() {
        return totalItems;
    }

    public void setTotalItems(long totalItems) {
        this.totalItems = totalItems;
    }
}

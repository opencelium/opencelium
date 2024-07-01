package com.becon.opencelium.backend.resource;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.annotation.Resource;

import java.util.Set;

@Resource
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CategoryResponseDTO {
    private Integer id;
    private String name;
    private CategoryResponseDTO parentCategory;
    private Set<Integer> subCategories;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Set<Integer> getSubCategories() {
        return subCategories;
    }

    public void setSubCategories(Set<Integer> subCategories) {
        this.subCategories = subCategories;
    }

    public CategoryResponseDTO getParentCategory() {
        return parentCategory;
    }

    public void setParentCategory(CategoryResponseDTO parentCategory) {
        this.parentCategory = parentCategory;
    }
}

package com.becon.opencelium.backend.resource;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.annotation.Resource;

import java.util.Set;

@Resource
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CategoryDTO {
    private Integer id;
    private String name;
    private Integer parentCategory;
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

    public Integer getParentCategory() {
        return parentCategory;
    }

    public void setParentCategory(Integer parentCategory) {
        this.parentCategory = parentCategory;
    }

    public Set<Integer> getSubCategories() {
        return subCategories;
    }

    public void setSubCategories(Set<Integer> subCategories) {
        this.subCategories = subCategories;
    }
}

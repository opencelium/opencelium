package com.becon.opencelium.backend.database.mysql.entity;


import jakarta.persistence.*;

import java.util.HashSet;
import java.util.Set;

@Entity(name = "category")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String name;
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "parent_category")
    private Category parentCategory;
    @OneToMany(mappedBy = "parentCategory", fetch = FetchType.EAGER)
    private Set<Category> subCategories = new HashSet<>();

    public Category() {
    }

    public Category(Integer id) {
        this.id = id;
    }

    public Integer getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public Category getParentCategory() {
        return parentCategory;
    }

    public Set<Category> getSubCategories() {
        return subCategories;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setParentCategory(Category parentCategory) {
        this.parentCategory = parentCategory;
    }

    public void setSubCategories(Set<Category> subCategories) {
        this.subCategories = subCategories;
    }
}

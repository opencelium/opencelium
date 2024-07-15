package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.Category;
import com.becon.opencelium.backend.resource.CategoryDTO;

import java.util.List;

public interface CategoryService {
    Integer add(CategoryDTO categoryDTO);
    void update(CategoryDTO categoryDTO);
    Category get(Integer id);
    List<Category> getAll();
    List<Category> getAllByIds(Iterable<Integer> ids);
    void cascadeDelete(Integer id);
    void cascadeDeleteAll(List<Integer> ids);
    boolean exists(Integer id);
    boolean existsByName(String name);
    void deleteOnly(Integer id);
    void deleteAllOnly(List<Integer> ids);
}

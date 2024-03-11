package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.Category;
import com.becon.opencelium.backend.resource.schedule.CategoryDTO;

import java.util.List;

public interface CategoryService {
    Integer add(CategoryDTO categoryDTO);
    void update(CategoryDTO categoryDTO);
    Category get(Integer id);
    List<Category> getAll();
    List<Category> getAllByIds(Iterable<Integer> ids);
    void delete(Integer id);
    void deleteAll(List<Integer> ids);
    boolean exists(Integer id);
}

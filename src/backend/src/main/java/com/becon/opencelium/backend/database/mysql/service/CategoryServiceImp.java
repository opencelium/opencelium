package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.Category;
import com.becon.opencelium.backend.database.mysql.repository.CategoryRepository;
import com.becon.opencelium.backend.resource.schedule.CategoryDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
public class CategoryServiceImp implements CategoryService {
    private final CategoryRepository repository;

    public CategoryServiceImp(CategoryRepository repository) {
        this.repository = repository;
    }

    @Override
    public Category add(CategoryDTO categoryDTO) {
        if (categoryDTO == null) {
            throw new RuntimeException("CATEGORY_IS_NULL");
        }

        checkTitle(categoryDTO.getName());

        Category curr = new Category();
        curr.setName(categoryDTO.getName());

        if (categoryDTO.getParentCategory() != null) {
            if (!repository.existsById(categoryDTO.getParentCategory())) {
                throw new RuntimeException("PARENT_CATEGORY_DOES_NOT_EXIST");
            }
            curr.setParentCategory(new Category(categoryDTO.getParentCategory()));
        }

        Category saved = repository.save(curr);

        if (categoryDTO.getSubCategories() != null) {
            categoryDTO.getSubCategories().forEach(id -> {
                if (!repository.existsById(id)) {
                    throw new RuntimeException("SUB_CATEGORY_DOES_NOT_EXIST(" + id + ")");
                } else {
                    Category child = get(id);
                    child.setParentCategory(saved);
                    repository.save(child);
                }
            });
        }
        return get(saved.getId());
    }

    private void checkTitle(String name) {
        if (name == null || name.isBlank()) {
            throw new RuntimeException("INVALID_CATEGORY_NAME");
        }

        if (repository.existsByNameEqualsIgnoreCase(name)) {
            throw new RuntimeException("TITLE_HAS_ALREADY_TAKEN");
        }
    }

    @Override
    @Transactional
    public Category update(CategoryDTO categoryDTO) {
        if (categoryDTO == null) {
            throw new RuntimeException("CATEGORY_IS_NULL");
        }

        if (categoryDTO.getId() == null || !repository.existsById(categoryDTO.getId())) {
            throw new RuntimeException("CATEGORY_DOES_NOT_EXIST");
        }
        Category old = get(categoryDTO.getId());

        if (!Objects.equals(categoryDTO.getName(), old.getName())) {
            checkTitle(categoryDTO.getName());
        }

        Category category = new Category(categoryDTO.getId());
        category.setName(categoryDTO.getName());
        category.setParentCategory(old.getParentCategory());
        if (categoryDTO.getParentCategory() != null) {
            if (old.getParentCategory() == null || !categoryDTO.getParentCategory().equals(old.getParentCategory().getId())) {
                if (!repository.existsById(categoryDTO.getId())) {
                    throw new RuntimeException("PARENT_CATEGORY_DOES_NOT_EXIST");
                } else {
                    category.setParentCategory(new Category(categoryDTO.getParentCategory()));
                }
            }
        } else {
            category.setParentCategory(null);
        }


        if (categoryDTO.getSubCategories() != null && old.getSubCategories() != null) {
            categoryDTO.getSubCategories().forEach(id -> {
                if (!repository.existsById(id)) {
                    throw new RuntimeException("SUB_CATEGORY_DOES_NOT_EXIST(" + id + ")");
                } else {
                    if (old.getSubCategories().stream().noneMatch(s -> s.getId().equals(id))) {
                        Category child = get(id);
                        child.setParentCategory(old);
                        repository.save(child);
                    }
                }
            });

            old.getSubCategories().forEach(c -> {
                if (categoryDTO.getSubCategories().stream().noneMatch(s -> s.equals(c.getId()))) {
                    c.setParentCategory(null);
                    repository.save(c);
                }
            });
        } else {
            if (old.getSubCategories() != null) {
                old.getSubCategories().forEach(c -> {
                    c.setParentCategory(null);
                    repository.save(c);
                });
            }
        }
        return repository.save(category);
    }

    @Override
    public Category get(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("PARENT_CATEGORY_DOES_NOT_EXIST"));
    }

    @Override
    public List<Category> getAll() {
        return repository.findAll();
    }

    @Override
    public List<Category> getAllByIds(Iterable<Integer> ids) {
        return repository.findAllById(ids);
    }

    @Override
    public void delete(Integer id) {
        Category category = get(id);
        category.getSubCategories().forEach(c -> delete(c.getId()));
        repository.deleteById(id);
    }

    @Override
    public void deleteAll(List<Integer> ids) {
        if (ids == null) {
            return;
        }
        ids.forEach(this::delete);
    }
}

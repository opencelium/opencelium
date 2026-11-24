package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.Category;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.repository.CategoryRepository;
import com.becon.opencelium.backend.resource.CategoryDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class CategoryServiceImp implements CategoryService {
    private static final Logger log = LoggerFactory.getLogger(CategoryServiceImp.class);
    private final CategoryRepository repository;
    private final ConnectionService connectionService;

    public CategoryServiceImp(
            CategoryRepository repository,
            @Lazy @Qualifier("connectionServiceImp") ConnectionService connectionService) {
        this.repository = repository;
        this.connectionService = connectionService;
    }

    @Override
    @Transactional
    public Integer add(CategoryDTO categoryDTO) {
        if (categoryDTO == null) {
            throw new RuntimeException("CATEGORY_IS_NULL");
        }

        checkName(categoryDTO.getName());

        Category curr = new Category();
        curr.setName(categoryDTO.getName());

        if (categoryDTO.getParentCategory() != null) {
            if (!repository.existsById(categoryDTO.getParentCategory())) {
                throw new RuntimeException("PARENT_CATEGORY_NOT_FOUND");
            }
            curr.setParentCategory(get(categoryDTO.getParentCategory()));
        }

        Category saved = repository.save(curr); //savepoint 1

        if (categoryDTO.getSubCategories() != null) {
            categoryDTO.getSubCategories().forEach(id -> {
                if (!repository.existsById(id)) {
                    throw new RuntimeException("SUB_CATEGORY_NOT_FOUND(" + id + ")");
                } else {
                    Category child = get(id);
                    child.setParentCategory(saved);
                    repository.save(child); //savepoint 2
                }
            });
        }

        checkCycle(saved);
        return saved.getId();
    }

    @Override
    @Transactional
    public void update(CategoryDTO categoryDTO) {
        if (categoryDTO == null) {
            throw new RuntimeException("CATEGORY_IS_NULL");
        }

        if (categoryDTO.getId() == null || !repository.existsById(categoryDTO.getId())) {
            throw new RuntimeException("CATEGORY_NOT_FOUND");
        }
        Category old = get(categoryDTO.getId());

        if (!Objects.equals(categoryDTO.getName(), old.getName())) {
            checkName(categoryDTO.getName());
        }

        Category category = new Category(categoryDTO.getId());
        category.setName(categoryDTO.getName());
        category.setParentCategory(old.getParentCategory());

        if (categoryDTO.getParentCategory() != null) {
            if (old.getParentCategory() == null || !categoryDTO.getParentCategory().equals(old.getParentCategory().getId())) {
                if (!repository.existsById(categoryDTO.getId())) {
                    throw new RuntimeException("PARENT_CATEGORY_NOT_FOUND");
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
                    throw new RuntimeException("SUB_CATEGORY_NOT_FOUND(" + id + ")");
                } else {
                    if (old.getSubCategories().stream().noneMatch(s -> s.getId().equals(id))) {
                        Category child = get(id);
                        child.setParentCategory(old);
                        repository.save(child); //savepoint 1
                    }
                }
            });

            old.getSubCategories().forEach(c -> {
                if (categoryDTO.getSubCategories().stream().noneMatch(s -> s.equals(c.getId()))) {
                    c.setParentCategory(null);
                    repository.save(c); //savepoint 2
                }
            });
        } else {
            if (old.getSubCategories() != null) {
                old.getSubCategories().forEach(c -> {
                    c.setParentCategory(null);
                    repository.save(c); //savepoint 3
                });
            }
        }
        Category saved = repository.save(category); //savepoint 4
        checkCycle(saved);
    }

    @Override
    public Category get(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("CATEGORY_NOT_FOUND"));
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
    @Transactional
    public void deleteOnly(Integer id) {
        Category category = get(id);
        List<Connection> connections = connectionService.getAllByCategoryId(category.getId());
        connections.forEach(c -> connectionService.updateCategory(c, null)); //savepoint 1
        Set<Category> subCategories = category.getSubCategories();
        if (subCategories != null) {
            subCategories.forEach(c -> {
                c.setParentCategory(null);
                repository.save(c); //savepoint 2
            });
        }
        repository.deleteById(category.getId());
    }

    @Override
    @Transactional
    public void deleteAllOnly(List<Integer> ids) {
        if (ids == null) {
            return;
        }
        ids.forEach(c -> {
            if (!exists(c)) {
                throw new RuntimeException("CATEGORY_NOT_FOUND");
            }
        });

        for (Integer id : ids) {
            try {
                deleteOnly(id);
            } catch (Exception e) {
                log.warn("Can't delete Category[id={}] or it has been already deleted", id);
            }
        }
    }

    @Override
    @Transactional
    public void cascadeDelete(Integer id) {
        Category category = get(id);
        List<Connection> connections = connectionService.getAllByCategoryId(category.getId());
        connectionService.deleteAll(connections); //delete all related connections
        if (category.getSubCategories() != null) {
            category.getSubCategories().forEach(c -> cascadeDelete(c.getId()));
        }
        repository.deleteById(category.getId());
    }

    @Override
    @Transactional
    public void cascadeDeleteAll(List<Integer> ids) {
        if (ids == null) {
            return;
        }
        ids.forEach(c -> {
            if (!exists(c)) {
                throw new RuntimeException("CATEGORY_NOT_FOUND(" + c + ")");
            }
        });
        for (Integer id : ids) {
            Category category;
            try {
                category = get(id);
            } catch (RuntimeException e) {
                log.warn("Can't delete Category[id={}] or it has been already deleted", id);
                continue;
            }
            cascadeDelete(category);
        }
    }

    @Override
    public boolean exists(Integer id) {
        return repository.existsById(id);
    }

    @Override
    public boolean existsByName(String name) {
        return repository.existsByNameEqualsIgnoreCase(name);
    }

    @Transactional
    protected void cascadeDelete(Category category) {    //exception free
        List<Connection> connections = connectionService.getAllByCategoryId(category.getId());
        connectionService.deleteAll(connections); //delete all related connections
        if (category.getSubCategories() != null) {
            for (Category sub : category.getSubCategories()) {
                if (exists(sub.getId())) {
                    cascadeDelete(sub);
                }
            }
        }
        repository.deleteById(category.getId());
    }

    private void checkName(String name) {
        if (name == null || name.isBlank()) {
            throw new RuntimeException("INVALID_CATEGORY_NAME");
        }

        if (repository.existsByNameEqualsIgnoreCase(name)) {
            throw new RuntimeException("TITLE_HAS_ALREADY_TAKEN");
        }
    }

    private void checkCycle(Category category) {
        if (category.getSubCategories() == null || category.getSubCategories().isEmpty()) {
            checkCycleRec(category, new ArrayList<>());
        } else {
            category.getSubCategories().forEach(s -> checkCycleRec(s, new ArrayList<>()));
        }
    }

    private void checkCycleRec(Category curr, List<Category> visited) {
        if (curr == null) return;
        if (visited.stream().noneMatch(c -> c.getId().equals(curr.getId()))) {
            visited.add(curr);
            checkCycleRec(curr.getParentCategory(), visited);
        } else {
            StringBuilder sb = new StringBuilder(curr.getName() + "(" + curr.getId() + ")");

            for (int i = visited.size() - 1; i >= 0; i--) {
                sb.append(" -> ")
                        .append(visited.get(i).getName())
                        .append("(")
                        .append(visited.get(i).getId())
                        .append(")");
                if (visited.get(i).getId().equals(curr.getId())) {
                    break;
                }
            }
            throw new RuntimeException("CYCLE_HAS_FOUND : " + sb);
        }
    }
}

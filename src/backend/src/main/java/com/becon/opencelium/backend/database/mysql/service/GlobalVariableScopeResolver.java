package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.Category;
import com.becon.opencelium.backend.database.mysql.repository.CategoryRepository;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

/**
 * Resolves what the scope rule of a global variable is checked against: a variable scoped to a
 * category also reaches the workflows of its subcategories, so a workflow is matched with its own
 * category and with every category above it.
 */
@Component
public class GlobalVariableScopeResolver {

    private final CategoryRepository categoryRepository;

    public GlobalVariableScopeResolver(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    /**
     * Returns the given category and every category above it.
     *
     * @param categoryId category of a workflow, or {@code null} for a workflow without one
     * @return the ids of the chain; empty when the workflow has no category or it no longer exists
     */
    public Set<Long> categoryChainOf(Integer categoryId) {
        Set<Long> chain = new HashSet<>();
        if (categoryId == null) {
            return chain;
        }

        Category category = categoryRepository.findById(categoryId).orElse(null);
        // the set also stops the walk if the parents ever form a cycle
        while (category != null && chain.add(category.getId().longValue())) {
            category = category.getParentCategory();
        }

        return chain;
    }
}

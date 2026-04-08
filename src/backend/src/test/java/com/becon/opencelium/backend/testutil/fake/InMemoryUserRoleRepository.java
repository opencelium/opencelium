/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.testutil.fake;

import com.becon.opencelium.backend.database.mysql.entity.UserRole;
import com.becon.opencelium.backend.database.mysql.repository.UserRoleRepository;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.repository.query.FluentQuery;

import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * In-memory fake for {@link UserRoleRepository}.
 *
 * Use this instead of a Mockito mock when a test needs realistic
 * repository behaviour — for example, verifying that a service correctly
 * calls save() and then findById(), or that deleteById() makes
 * existsById() return false.
 *
 * Mockito mocks require explicit when(…).thenReturn(…) for every call.
 * This fake behaves like a real repository without a database, so tests
 * read as behaviour specifications rather than interaction scripts.
 *
 * Usage:
 *   InMemoryUserRoleRepository repository = new InMemoryUserRoleRepository();
 *   UserRoleServiceImpl service = new UserRoleServiceImpl(repository, mapper);
 *
 * Bulk setup example:
 * <pre>
 *  {@literal @}BeforeEach
 *  void setUp() {
 *     repository = new InMemoryUserRoleRepository();
 *     userRoleService = new UserRoleServiceImpl(repository, mapper);
 *
 *     repository.saveAll(List.of(
 *         UserRoleFixture.aStandardUserRole(),
 *         UserRoleFixture.anAdminRole()
 *     ));
 *  }
 * </pre>
 */
public class InMemoryUserRoleRepository implements UserRoleRepository {

    private final Map<Integer, UserRole> store = new HashMap<>();
    private final AtomicInteger idSequence = new AtomicInteger(1);

    // ── Write operations ──────────────────────────────────────────────────────

    @Override
    public <S extends UserRole> S save(S userRole) {
        if (userRole.getId() == 0) {
            userRole.setId(idSequence.getAndIncrement());
        }
        store.put(userRole.getId(), userRole);
        return userRole;
    }

    @Override
    public <S extends UserRole> List<S> saveAll(Iterable<S> entities) {
        List<S> result = new ArrayList<>();
        entities.forEach(e -> result.add(save(e)));
        return result;
    }

    @Override
    public void deleteById(Integer id) {
        store.remove(id);
    }

    @Override
    public void delete(UserRole userRole) {
        store.remove(userRole.getId());
    }

    @Override
    public void deleteAll() {
        store.clear();
    }

    @Override
    public void deleteAll(Iterable<? extends UserRole> entities) {
        entities.forEach(e -> store.remove(e.getId()));
    }

    @Override
    public void deleteAllById(Iterable<? extends Integer> ids) {
        ids.forEach(store::remove);
    }

    // ── Query operations ──────────────────────────────────────────────────────

    @Override
    public Optional<UserRole> findById(Integer id) {
        return Optional.ofNullable(store.get(id));
    }

    @Override
    public boolean existsById(Integer id) {
        return store.containsKey(id);
    }

    @Override
    public List<UserRole> findAll() {
        return new ArrayList<>(store.values());
    }

    @Override
    public List<UserRole> findAllById(Iterable<Integer> ids) {
        List<UserRole> result = new ArrayList<>();
        ids.forEach(id -> {
            if (store.containsKey(id)) result.add(store.get(id));
        });
        return result;
    }

    @Override
    public long count() {
        return store.size();
    }

    /**
     * Finds a role by name — mirrors the real repository's existsByRole /
     * findByRole behaviour used in {@link com.becon.opencelium.backend.database.mysql.service.UserRoleServiceImpl}.
     */
    public Optional<UserRole> findByName(String name) {
        return store.values().stream()
                .filter(r -> r.getName().equals(name))
                .findFirst();
    }

    public boolean existsByName(String name) {
        return store.values().stream()
                .anyMatch(r -> r.getName().equals(name));
    }

    // ── Unsupported JPA operations (not needed for unit/slice tests) ──────────

    @Override
    public void flush() {}

    @Override
    public <S extends UserRole> S saveAndFlush(S entity) {
        return save(entity);
    }

    @Override
    public <S extends UserRole> List<S> saveAllAndFlush(Iterable<S> entities) {
        return saveAll(entities);
    }

    @Override
    public void deleteAllInBatch(Iterable<UserRole> entities) {
        deleteAll(entities);
    }

    @Override
    public void deleteAllByIdInBatch(Iterable<Integer> ids) {
        deleteAllById(ids);
    }

    @Override
    public void deleteAllInBatch() {
        store.clear();
    }

    @Override
    public UserRole getOne(Integer id) {
        return store.get(id);
    }

    @Override
    public UserRole getById(Integer id) {
        return store.get(id);
    }

    @Override
    public UserRole getReferenceById(Integer id) {
        return store.get(id);
    }

    @Override
    public List<UserRole> findAll(Sort sort) {
        throw new UnsupportedOperationException("Sorting not supported in fake");
    }

    @Override
    public Page<UserRole> findAll(Pageable pageable) {
        throw new UnsupportedOperationException("Pagination not supported in fake");
    }

    @Override
    public <S extends UserRole> Optional<S> findOne(Example<S> example) {
        throw new UnsupportedOperationException("Example queries not supported in fake");
    }

    @Override
    public <S extends UserRole> List<S> findAll(Example<S> example) {
        throw new UnsupportedOperationException("Example queries not supported in fake");
    }

    @Override
    public <S extends UserRole> List<S> findAll(Example<S> example, Sort sort) {
        throw new UnsupportedOperationException("Example queries not supported in fake");
    }

    @Override
    public <S extends UserRole> Page<S> findAll(Example<S> example, Pageable pageable) {
        throw new UnsupportedOperationException("Example queries not supported in fake");
    }

    @Override
    public <S extends UserRole> long count(Example<S> example) {
        throw new UnsupportedOperationException("Example queries not supported in fake");
    }

    @Override
    public <S extends UserRole> boolean exists(Example<S> example) {
        throw new UnsupportedOperationException("Example queries not supported in fake");
    }

    @Override
    public <S extends UserRole, R> R findBy(Example<S> example,
                                             Function<FluentQuery.FetchableFluentQuery<S>, R> queryFunction) {
        throw new UnsupportedOperationException("Fluent queries not supported in fake");
    }
}

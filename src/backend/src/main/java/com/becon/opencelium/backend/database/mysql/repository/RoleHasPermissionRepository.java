package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.RoleHasPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface RoleHasPermissionRepository extends JpaRepository<RoleHasPermission, RoleHasPermission.RoleHasPermissionId> {

    @Transactional
    @Modifying
//    @Query(value = "delete from role_has_permission where role_id = ?1", nativeQuery = true)
    void deleteByUserRoleId(int roleId);
}

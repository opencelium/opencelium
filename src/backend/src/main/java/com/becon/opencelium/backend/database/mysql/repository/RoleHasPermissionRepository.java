package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.RoleHasPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface RoleHasPermissionRepository extends JpaRepository<RoleHasPermission, RoleHasPermission.RoleHasPermissionId> {

    @Modifying
    @Query("DELETE FROM RoleHasPermission r WHERE r.id.roleId = :roleId")
    void deleteByUserRoleId(@Param("roleId") int roleId);
}

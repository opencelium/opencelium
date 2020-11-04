package com.becon.opencelium.backend.mysql.repository;

import com.becon.opencelium.backend.mysql.entity.RoleHasPermission;
import com.becon.opencelium.backend.mysql.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface RoleHasPermissionRepository extends JpaRepository<RoleHasPermission, RoleHasPermission.RoleHasPermissionId> {

    void deleteByUserRole(UserRole roleId);
}

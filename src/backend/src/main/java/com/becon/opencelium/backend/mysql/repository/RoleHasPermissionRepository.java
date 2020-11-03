package com.becon.opencelium.backend.mysql.repository;

import com.becon.opencelium.backend.mysql.entity.RoleHasPermission;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleHasPermissionRepository extends JpaRepository<RoleHasPermission, RoleHasPermission.RoleHasPermissionId> {
}

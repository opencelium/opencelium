package com.becon.opencelium.backend.mysql.repository;

import com.becon.opencelium.backend.mysql.entity.Widget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WidgetRepository extends JpaRepository<Widget, Integer> {
}

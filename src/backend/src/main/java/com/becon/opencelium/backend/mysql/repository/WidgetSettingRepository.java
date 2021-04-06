package com.becon.opencelium.backend.mysql.repository;

import com.becon.opencelium.backend.mysql.entity.WidgetSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WidgetSettingRepository extends JpaRepository<WidgetSetting, Integer> {
    List<WidgetSetting> findByUserId(int userId);
}

package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.WidgetSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WidgetSettingRepository extends JpaRepository<WidgetSetting, Integer> {
    List<WidgetSetting> findByUserId(int userId);
//
    @Query(value = "delete from widget_setting where id = ?1", nativeQuery = true)
    void deleteById(int id);

    @Query(value = "delete from widget_setting", nativeQuery = true)
    void deleteAll();

    List<WidgetSetting> findAllByUserId(int id);
}

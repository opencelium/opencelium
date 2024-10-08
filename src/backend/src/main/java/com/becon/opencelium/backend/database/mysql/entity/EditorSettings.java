package com.becon.opencelium.backend.database.mysql.entity;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "connection_editor_settings")
public class EditorSettings implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "color_mode")
    private String colorMode;

    @Column(name = "process_text_size")
    private int processTextSize;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getColorMode() {
        return colorMode;
    }

    public void setColorMode(String colorMode) {
        this.colorMode = colorMode;
    }

    public int getProcessTextSize() {
        return processTextSize;
    }

    public void setProcessTextSize(int processTextSize) {
        this.processTextSize = processTextSize;
    }
}

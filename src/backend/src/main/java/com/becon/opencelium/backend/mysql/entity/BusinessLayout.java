package com.becon.opencelium.backend.mysql.entity;

import com.becon.opencelium.backend.resource.blayout.BusinessLayoutResource;
import com.fasterxml.jackson.annotation.JsonIgnore;

import javax.persistence.*;
import java.util.List;
import java.util.stream.Collectors;

@Entity
@Table(name = "business_layout")
public class BusinessLayout {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private int id;

    @Column(name = "name")
    private String name;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "connection_id")
    private Connection connection;

    @OneToMany(mappedBy = "bLayout", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<BLsvgItem> svgItems;

    @OneToMany(mappedBy = "bLayout", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<BLarrow> arrows;

    public BusinessLayout(BusinessLayoutResource businessLayoutResource) {
        this.id = businessLayoutResource.getId();
        this.arrows = businessLayoutResource.getArrows().stream().map(BLarrow::new).collect(Collectors.toList());
        this.svgItems = businessLayoutResource.getSvgItems().stream().map(BLsvgItem::new).collect(Collectors.toList());
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Connection getConnection() {
        return connection;
    }

    public void setConnection(Connection connection) {
        this.connection = connection;
    }

    public List<BLsvgItem> getSvgItems() {
        return svgItems;
    }

    public void setSvgItems(List<BLsvgItem> svgItems) {
        this.svgItems = svgItems;
    }

    public List<BLarrow> getArrows() {
        return arrows;
    }

    public void setArrows(List<BLarrow> arrows) {
        this.arrows = arrows;
    }
}

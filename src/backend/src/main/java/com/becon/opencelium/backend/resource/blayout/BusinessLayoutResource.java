package com.becon.opencelium.backend.resource.blayout;

import com.becon.opencelium.backend.mysql.entity.BusinessLayout;

import java.util.List;
import java.util.stream.Collectors;

public class BusinessLayoutResource {

    private int id;
    private List<BLayoutArrowResource> arrows;
    private List<BLayoutSvgItemResource> svgItems;

    public BusinessLayoutResource() {
    }

    public BusinessLayoutResource(BusinessLayout businessLayout) {
        if (businessLayout == null) {
            return;
        }
        this.id = businessLayout.getId();
        this.arrows = businessLayout.getArrows().stream().map(BLayoutArrowResource::new).collect(Collectors.toList());
        this.svgItems = businessLayout.getSvgItems().stream().map(BLayoutSvgItemResource::new).collect(Collectors.toList());
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public List<BLayoutArrowResource> getArrows() {
        return arrows;
    }

    public void setArrows(List<BLayoutArrowResource> arrows) {
        this.arrows = arrows;
    }

    public List<BLayoutSvgItemResource> getSvgItems() {
        return svgItems;
    }

    public void setSvgItems(List<BLayoutSvgItemResource> svgItems) {
        this.svgItems = svgItems;
    }
}

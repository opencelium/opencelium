package com.becon.opencelium.backend.resource.execution;

import com.becon.opencelium.backend.enums.execution.ParamLocation;
import com.becon.opencelium.backend.enums.execution.ParamStyle;
import org.springframework.http.MediaType;

public class ParameterDTO {
    private String name;
    private ParamLocation in;
    private ParamStyle style;
    private boolean explode;
    private MediaType content;
    private SchemaDTO schema;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public ParamLocation getIn() {
        return in;
    }

    public void setIn(ParamLocation in) {
        this.in = in;
    }

    public ParamStyle getStyle() {
        return style;
    }

    public void setStyle(ParamStyle style) {
        this.style = style;
    }

    public boolean isExplode() {
        return explode;
    }

    public void setExplode(boolean explode) {
        this.explode = explode;
    }

    public MediaType getContent() {
        return content;
    }

    public void setContent(MediaType content) {
        this.content = content;
    }

    public SchemaDTO getSchema() {
        return schema;
    }

    public void setSchema(SchemaDTO schema) {
        this.schema = schema;
    }
}

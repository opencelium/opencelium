package com.becon.opencelium.backend.versionmanager.template;

import com.becon.opencelium.backend.constant.props.OpenceliumProps;
import com.becon.opencelium.backend.resource.v5.template.TemplateV5;
import com.becon.opencelium.backend.versionmanager.EntityUpdater;
import com.becon.opencelium.backend.versionmanager.base.Utils;
import org.springframework.stereotype.Component;

@Component
public class TemplateV5Updater implements EntityUpdater<TemplateV5> {

    private final OpenceliumProps openceliumProps;

    public TemplateV5Updater(OpenceliumProps openceliumProps) {
        this.openceliumProps = openceliumProps;
    }

    @Override
    public TemplateV5 updateToCurrentVersion(TemplateV5 data) {
        return updateFrom(data, data.getVersion());
    }

    @Override
    public TemplateV5 updateFrom(TemplateV5 data, String oldVersion) {
        if (data == null) {
            return null;
        }

        if (Utils.compare(oldVersion, "4.4") < 0) {
            throw new RuntimeException("Update to 4.4 version first");
        }

        data.setVersion(openceliumProps.getVersion());
        return data;
    }
}

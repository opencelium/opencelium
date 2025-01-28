package com.becon.opencelium.backend.version_manager.template;

import com.becon.opencelium.backend.template.entity.Template;
import com.becon.opencelium.backend.version_manager.Wrapper;
import com.becon.opencelium.backend.version_manager.base.UpdaterVersion;

public class Template43Updater implements TemplateUpdater {

    private static final UpdaterVersion currentVersion = UpdaterVersion.VERSION_4_3;

    private static final Template43Updater instance = new Template43Updater();

    public static Template43Updater getInstance() {
        return instance;
    }

    @Override
    public Wrapper<Template> updateToCurrentVersion(Template data) {
        return null;//TODO
    }

    @Override
    public Wrapper<Template> updateFrom(Template data, String oldVersion) {
        return null;//TODO
    }
}

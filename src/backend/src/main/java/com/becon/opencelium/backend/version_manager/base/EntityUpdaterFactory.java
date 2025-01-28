package com.becon.opencelium.backend.version_manager.base;

import com.becon.opencelium.backend.version_manager.EntityUpdater;
import com.becon.opencelium.backend.version_manager.connectionmng.Connection43MngUpdater;
import com.becon.opencelium.backend.version_manager.enhancement.Enhancement43Updater;
import com.becon.opencelium.backend.version_manager.template.Template43Updater;

public class EntityUpdaterFactory {

    @SuppressWarnings("unchecked")
    public static <T> EntityUpdater<T> getEntityUpdater(Class<T> clazz, UpdaterVersion version) {
        return switch (UpdaterType.getByClass(clazz)) {
            case CONNECTION_MNG -> switch (version) {
                case NO_VERSION -> (EntityUpdater<T>) DefaultUpdater.getInstance();
                case VERSION_4_3 -> (EntityUpdater<T>) Connection43MngUpdater.getInstance();
            };
            case ENHANCEMENT -> switch (version) {
                case NO_VERSION -> (EntityUpdater<T>) DefaultUpdater.getInstance();
                case VERSION_4_3 -> (EntityUpdater<T>) Enhancement43Updater.getInstance();
            };
            case TEMPLATE -> switch (version) {
                case NO_VERSION -> (EntityUpdater<T>) DefaultUpdater.getInstance();
                case VERSION_4_3 -> (EntityUpdater<T>) Template43Updater.getInstance();
            };
        };
    }
}

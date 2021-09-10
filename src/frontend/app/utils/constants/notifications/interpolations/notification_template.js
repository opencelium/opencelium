import React from "react";
import {store} from "@utils/store";
import {setSearchValue} from "@actions/app";
import {navigateTo} from "@utils/app";
import Translate from "@components/general/app/Translate";
import styles from "@themes/default/layout/notification";

const ADD_NOTIFICATIONTEMPLATE = (params) => {
    const {name} = params;
    const openPage = () => {
        store.dispatch(setSearchValue(name));
        navigateTo('notification_templates');
    }
    return (
        <Translate i18nKey="notifications:SUCCESS.ADD_NOTIFICATIONTEMPLATE">
            The notification template <span className={styles.link} onClick={openPage}>{name}</span> was successfully added.
        </Translate>
    );
}
const UPDATE_NOTIFICATIONTEMPLATE = (params) => {
    const {name} = params;
    const openPage = () => {
        store.dispatch(setSearchValue(name));
        navigateTo('notification_templates');
    }
    return (
        <Translate i18nKey="notifications:SUCCESS.UPDATE_NOTIFICATIONTEMPLATE">
            The notification template <span className={styles.link} onClick={openPage}>{name}</span> was successfully updated.
        </Translate>
    );
}
const DELETE_NOTIFICATIONTEMPLATE = (params) => {
    const {name} = params;
    return (
        <Translate i18nKey="notifications:SUCCESS.DELETE_NOTIFICATIONTEMPLATE">
            The notification template <span className={styles.emphasize}>{name}</span> was successfully removed.
        </Translate>
    );
}

export default {
    ADD_NOTIFICATIONTEMPLATE,
    UPDATE_NOTIFICATIONTEMPLATE,
    DELETE_NOTIFICATIONTEMPLATE,
}
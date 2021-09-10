import React from "react";
import {store} from "@utils/store";
import {setSearchValue} from "@actions/app";
import {navigateTo} from "@utils/app";
import Translate from "@components/general/app/Translate";
import styles from "@themes/default/layout/notification";

const ADD_SCHEDULE = (params) => {
    const {title} = params;
    const openPage = () => {
        store.dispatch(setSearchValue(title));
        navigateTo('schedules');
    }
    return (
        <Translate i18nKey="notifications:SUCCESS.ADD_SCHEDULE">
            The schedule <span className={styles.link} onClick={openPage}>{title}</span> was successfully added.
        </Translate>
    );
}
const ADD_SCHEDULENOTIFICATION = (params) => {
    const {name, scheduleTitle} = params;
    const openPage = () => {
        store.dispatch(setSearchValue(scheduleTitle));
        navigateTo('schedules');
    }
    return (
        <Translate i18nKey="notifications:SUCCESS.ADD_SCHEDULENOTIFICATION">
            The notification <span className={styles.emphasize}>{name}</span> of schedule <span className={styles.link} onClick={openPage}>{scheduleTitle}</span> was successfully added.
        </Translate>
    );
}
const UPDATE_SCHEDULE = (params) => {
    const {title} = params;
    const openPage = () => {
        store.dispatch(setSearchValue(title));
        navigateTo('schedules');
    }
    return (
        <Translate i18nKey="notifications:SUCCESS.UPDATE_SCHEDULE">
            The schedule <span className={styles.link} onClick={openPage}>{title}</span> was successfully updated.
        </Translate>
    );
}
const UPDATE_SCHEDULENOTIFICATION = (params) => {
    const {name, scheduleTitle} = params;
    const openPage = () => {
        store.dispatch(setSearchValue(scheduleTitle));
        navigateTo('schedules');
    }
    return (
        <Translate i18nKey="notifications:SUCCESS.UPDATE_SCHEDULENOTIFICATION">
            The notification <span className={styles.emphasize}>{name}</span> of schedule <span className={styles.link} onClick={openPage}>{scheduleTitle}</span> was successfully updated.
        </Translate>
    );
}
const UPDATE_SCHEDULESTATUS = (params) => {
    const {title} = params;
    const openPage = () => {
        store.dispatch(setSearchValue(title));
        navigateTo('schedules');
    }
    return (
        <Translate i18nKey="notifications:SUCCESS.UPDATE_SCHEDULESTATUS">
            The status of schedule <span className={styles.link} onClick={openPage}>{title}</span> was successfully updated.
        </Translate>
    );
}
const TRIGGER_SCHEDULE = (params) => {
    const title = params ? params.title : '';
    const openPage = () => {
        store.dispatch(setSearchValue(title));
        navigateTo('schedules');
    }
    return (
        <Translate i18nKey="notifications:SUCCESS.TRIGGER_SCHEDULE">
            The schedule <span className={styles.link} onClick={openPage}>{title}</span> was successfully triggered.
        </Translate>
    );
}
const DELETE_SCHEDULE = (params) => {
    const {title} = params;
    return (
        <Translate i18nKey="notifications:SUCCESS.DELETE_SCHEDULE">
            The schedule <span className={styles.emphasize}>{title}</span> was successfully removed.
        </Translate>
    );
}
const DELETE_SCHEDULENOTIFICATION = (params) => {
    const {name, scheduleTitle} = params;
    const openPage = () => {
        store.dispatch(setSearchValue(scheduleTitle));
        navigateTo('schedules');
    }
    return (
        <Translate i18nKey="notifications:SUCCESS.DELETE_SCHEDULENOTIFICATION">
            The notification <span className={styles.emphasize}>{name}</span> of schedule <span className={styles.link} onClick={openPage}>{scheduleTitle}</span> was successfully removed.
        </Translate>
    );
}

export default {
    ADD_SCHEDULE,
    UPDATE_SCHEDULE,
    DELETE_SCHEDULE,
    UPDATE_SCHEDULESTATUS,
    TRIGGER_SCHEDULE,
    ADD_SCHEDULENOTIFICATION,
    UPDATE_SCHEDULENOTIFICATION,
    DELETE_SCHEDULENOTIFICATION,
}
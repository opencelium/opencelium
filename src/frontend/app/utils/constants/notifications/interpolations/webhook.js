import React from "react";
import {store} from "@utils/store";
import {setSearchValue} from "@actions/app";
import {navigateTo} from "@utils/app";
import Translate from "@components/general/app/Translate";
import styles from "@themes/default/layout/notification";

const ADD_WEBHOOK = (params) => {
    const title = params.schedule ? params.schedule.title : '';
    const openPage = () => {
        store.dispatch(setSearchValue(title));
        navigateTo('schedules');
    }
    return (
        <Translate i18nKey="notifications:SUCCESS.ADD_WEBHOOK">
            The webhook of schedule <span className={styles.link} onClick={openPage}>{title}</span> was successfully added.
        </Translate>
    );
}
const DELETE_WEBHOOK = (params) => {
    const title = params.schedule ? params.schedule.title : '';
    const openPage = () => {
        store.dispatch(setSearchValue(title));
        navigateTo('schedules');
    }
    return (
        <Translate i18nKey="notifications:SUCCESS.DELETE_WEBHOOK">
            The schedule of schedule <span className={styles.link} onClick={openPage}>{title}</span> was successfully removed.
        </Translate>
    );
}

export default {
    ADD_WEBHOOK,
    DELETE_WEBHOOK,
}
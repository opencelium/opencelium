import React from "react";
import {store} from "@utils/store";
import {setSearchValue} from "@actions/app";
import {navigateTo} from "@utils/app";
import Translate from "@components/general/app/Translate";
import styles from "@themes/default/layout/notification";

const ADD_CONNECTOR = (params) => {
    const {title} = params;
    const openPage = () => {
        store.dispatch(setSearchValue(title));
        navigateTo('connectors');
    }
    return (
        <Translate i18nKey="notifications:SUCCESS.ADD_CONNECTOR">
            The connector <span className={styles.link} onClick={openPage}>{title}</span> was successfully added.
        </Translate>
    );
}
const UPDATE_CONNECTOR = (params) => {
    const {title} = params;
    const openPage = () => {
        store.dispatch(setSearchValue(title));
        navigateTo('connectors');
    }
    return (
        <Translate i18nKey="notifications:SUCCESS.UPDATE_CONNECTOR">
            The connector <span className={styles.link} onClick={openPage}>{title}</span> was successfully updated.
        </Translate>
    );
}
const DELETE_CONNECTOR = (params) => {
    const {title} = params;
    return (
        <Translate i18nKey="notifications:SUCCESS.DELETE_CONNECTOR">
            The connector <span className={styles.emphasize}>{title}</span> was successfully removed.
        </Translate>
    );
}

export default {
    ADD_CONNECTOR,
    UPDATE_CONNECTOR,
    DELETE_CONNECTOR,
}
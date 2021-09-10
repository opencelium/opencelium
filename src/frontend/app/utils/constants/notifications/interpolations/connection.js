import React from "react";
import {store} from "@utils/store";
import {setSearchValue} from "@actions/app";
import {navigateTo} from "@utils/app";
import Translate from "@components/general/app/Translate";
import styles from "@themes/default/layout/notification";

const ADD_CONNECTION = (params) => {
    const {title} = params;
    const openPage = () => {
        store.dispatch(setSearchValue(title));
        navigateTo('connections');
    }
    return (
        <Translate i18nKey="notifications:SUCCESS.ADD_CONNECTION">
            The connection <span className={styles.link} onClick={openPage}>{title}</span> was successfully added.
        </Translate>
    );
}
const UPDATE_CONNECTION = (params) => {
    const {title} = params;
    const openPage = () => {
        store.dispatch(setSearchValue(title));
        navigateTo('connections');
    }
    return (
        <Translate i18nKey="notifications:SUCCESS.UPDATE_CONNECTION">
            The connection <span className={styles.link} onClick={openPage}>{title}</span> was successfully updated.
        </Translate>
    );
}
const DELETE_CONNECTION = (params) => {
    const {title} = params;
    return (
        <Translate i18nKey="notifications:SUCCESS.DELETE_CONNECTION">
            The connection <span className={styles.emphasize}>{title}</span> was successfully removed.
        </Translate>
    );
}

export default {
    ADD_CONNECTION,
    UPDATE_CONNECTION,
    DELETE_CONNECTION,
}
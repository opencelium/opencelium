import React from "react";
import {store} from "@utils/store";
import {setSearchValue} from "@actions/app";
import {navigateTo} from "@utils/app";
import Translate from "@components/general/app/Translate";
import styles from "@themes/default/layout/notification";

const ADD_USERGROUP = (params) => {
    const {name} = params;
    const openPage = () => {
        store.dispatch(setSearchValue(name));
        navigateTo('usergroups');
    }
    return (
        <Translate i18nKey="notifications:SUCCESS.ADD_USERGROUP">
            The user group <span className={styles.link} onClick={openPage}>{name}</span> was successfully added.
        </Translate>
    );
}
const UPDATE_USERGROUP = (params) => {
    const {name} = params;
    const openPage = () => {
        store.dispatch(setSearchValue(name));
        navigateTo('usergroups');
    }
    return (
        <Translate i18nKey="notifications:SUCCESS.UPDATE_USERGROUP">
            The user group <span className={styles.link} onClick={openPage}>{name}</span> was successfully updated.
        </Translate>
    );
}
const DELETE_USERGROUP = (params) => {
    const {name} = params;
    return (
        <Translate i18nKey="notifications:SUCCESS.DELETE_USERGROUP">
            The user group <span className={styles.emphasize}>{name}</span> was successfully deleted.
        </Translate>
    );
}

export default {
    ADD_USERGROUP,
    UPDATE_USERGROUP,
    DELETE_USERGROUP,
}
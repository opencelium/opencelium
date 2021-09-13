import React from "react";
import {store} from "@utils/store";
import {setSearchValue} from "@actions/app";
import {navigateTo} from "@utils/app";
import Translate from "@components/general/app/Translate";
import styles from "@themes/default/layout/notification";

const ADD_USER = (params) => {
    const {email} = params;
    const openPage = () => {
        store.dispatch(setSearchValue(email));
        navigateTo('users');
    }
    return (
        <Translate i18nKey="notifications:SUCCESS.ADD_USER">
            The user <span className={styles.link} onClick={openPage}>{email}</span> was successfully added.
        </Translate>
    );
}
const UPDATE_USER = (params) => {
    const {email} = params;
    const openPage = () => {
        store.dispatch(setSearchValue(email));
        navigateTo('users');
    }
    return (
        <Translate i18nKey="notifications:SUCCESS.UPDATE_USER">
            The user <span className={styles.link} onClick={openPage}>{email}</span> was successfully updated.
        </Translate>
    );
}
const DELETE_USER = (params) => {
    const {email} = params;
    return (
        <Translate i18nKey="notifications:SUCCESS.DELETE_USER">
            The user <span className={styles.emphasize}>{email}</span> was successfully removed.
        </Translate>
    );
}

export default {
    ADD_USER,
    UPDATE_USER,
    DELETE_USER,
}
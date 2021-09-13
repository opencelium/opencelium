import React from "react";
import {store} from "@utils/store";
import {setSearchValue} from "@actions/app";
import {navigateTo} from "@utils/app";
import Translate from "@components/general/app/Translate";
import styles from "@themes/default/layout/notification";

const ADD_INVOKER = (params) => {
    const {id} = params;
    const openPage = () => {
        store.dispatch(setSearchValue(id));
        navigateTo('invokers');
    }
    return (
        <Translate i18nKey="notifications:SUCCESS.ADD_INVOKER">
            The invoker <span className={styles.link} onClick={openPage}>{id}</span> was successfully added.
        </Translate>
    );
}
const UPDATE_INVOKER = (params) => {
    const {id} = params;
    const openPage = () => {
        store.dispatch(setSearchValue(id));
        navigateTo('invokers');
    }
    return (
        <Translate i18nKey="notifications:SUCCESS.UPDATE_INVOKER">
            The invoker <span className={styles.link} onClick={openPage}>{id}</span> was successfully updated.
        </Translate>
    );
}
const DELETE_INVOKER = (params) => {
    const {id} = params;
    return (
        <Translate i18nKey="notifications:SUCCESS.DELETE_INVOKER">
            The invoker <span className={styles.emphasize}>{id}</span> was successfully removed.
        </Translate>
    );
}

export default {
    ADD_INVOKER,
    UPDATE_INVOKER,
    DELETE_INVOKER,
}
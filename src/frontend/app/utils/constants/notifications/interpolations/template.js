import React from "react";
import Translate from "@components/general/app/Translate";
import styles from "@themes/default/layout/notification";
import {store} from "@utils/store";
import {setSearchValue} from "@actions/app";
import {navigateTo} from "@utils/app";

const DELETE_TEMPLATE = (params) => {
    const {name} = params;
    return (
        <Translate i18nKey="notifications:SUCCESS.DELETE_TEMPLATE">
            The template <span className={styles.emphasize}>{name}</span> was successfully removed.
        </Translate>
    );
}

const IMPORT_TEMPLATE = (params) => {
    const {name} = params;
    const openPage = () => {
        store.dispatch(setSearchValue(name));
        navigateTo('templates');
    }
    return (
        <Translate i18nKey="notifications:SUCCESS.IMPORT_TEMPLATE">
            The template <span className={styles.link} onClick={openPage}>{name}</span> was successfully imported.
        </Translate>
    );
}

const EXPORT_TEMPLATE = (params) => {
    const {name} = params;
    const openPage = () => {
        store.dispatch(setSearchValue(name));
        navigateTo('templates');
    }
    return (
        <Translate i18nKey="notifications:SUCCESS.EXPORT_TEMPLATE">
            The template <span className={styles.link} onClick={openPage}>{name}</span> was successfully downloaded.
        </Translate>
    );
}

export default {
    DELETE_TEMPLATE,
    IMPORT_TEMPLATE,
    EXPORT_TEMPLATE,
}
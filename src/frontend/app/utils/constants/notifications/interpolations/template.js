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

const ADD_TEMPLATE = (params) => {
    const {name, connection} = params;
    const title = connection ? connection.title : '';
    const openTemplatePage = () => {
        store.dispatch(setSearchValue(name));
        navigateTo('templates');
    }
    const openConnectionPage = () => {
        store.dispatch(setSearchValue(title));
        navigateTo('connections');
    }
    return (
        <Translate i18nKey="notifications:SUCCESS.ADD_TEMPLATE">
            The template <span className={styles.link} onClick={openTemplatePage}>{name}</span> of the <span className={styles.link} onClick={openConnectionPage}>{title}</span> was successfully added.
        </Translate>
    );
}

const CONVERT_TEMPLATE = (params) => {
    const {newTemplate} = params;
    const name = newTemplate ? newTemplate.name : '';
    const openPage = () => {
        store.dispatch(setSearchValue(name));
        navigateTo('templates');
    }
    return (
        <Translate i18nKey="notifications:SUCCESS.CONVERT_TEMPLATE">
            The template <span className={styles.link} onClick={openPage}>{name}</span> was successfully converted.
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
    ADD_TEMPLATE,
    CONVERT_TEMPLATE,
    IMPORT_TEMPLATE,
    EXPORT_TEMPLATE,
}
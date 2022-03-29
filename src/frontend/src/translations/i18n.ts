import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ChainedBackend from "i18next-chained-backend";
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import resourcesToBackend from "i18next-resources-to-backend";
import {NotificationTranslations} from "./en/notifications";

const localResources = {
    en:{
        translation:{
            "TRANS_KEY_NOT_EXIST": "Such translation key does not exist",
            "TEXT": "My Text",
            permissions:{
                "CREATE": "Create",
                "READ": "Read",
                "UPDATE": "Update",
                "DELETE": "Delete",
                "ADMIN": "Admin"
            },
            notifications:{
                ...NotificationTranslations
            },
        },
    }};

export default i18n
    .use(ChainedBackend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        lng: 'en',
        fallbackLng: "en",
        preload: ['en'],
        interpolation: {
            escapeValue: false,
        },/*
        react: {
            useSuspense: false,
        },*/
        backend: {
            backends: [HttpBackend, resourcesToBackend(localResources)],
            backendOptions: [{loadPath: `${window.location.protocol}//${window.location.host}/locales/{{lng}}/{{ns}}.json`}],
        }
    }
);
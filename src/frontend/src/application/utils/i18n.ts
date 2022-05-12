/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ChainedBackend from "i18next-chained-backend";
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import resourcesToBackend from "i18next-resources-to-backend";
import {translations as ApplicationTranslations} from "../translations";
import {deepObjectsMerge} from "./utils";

const translations = {
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
        },
    }
}

const localResources = deepObjectsMerge({...translations}, {...ApplicationTranslations});
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
        },
        react: {
            useSuspense: false,
        },
        backend: {
            backends: [HttpBackend, resourcesToBackend(localResources)],
            backendOptions: [{loadPath: `${window.location.protocol}//${window.location.host}/locales/{{lng}}/{{ns}}.json`}],
        }}
    );
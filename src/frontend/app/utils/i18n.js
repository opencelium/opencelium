/*
 * Copyright (C) <2021>  <becon GmbH>
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

import i18n from 'i18next';
import Backend from 'i18next-xhr-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import {defaultLanguage} from "./constants/languages";
import {AppSettings} from "./constants/app";


/**
 * set i18n settings
 */
const i18nSettings = {
    debug: AppSettings.i18nDebug,
    lng: defaultLanguage.code,
    fallbackLng: defaultLanguage.code,
    ns: ['common'],
    defaultNS: 'common',
    interpolation: {
        escapeValue: false,
    }
};

/**
 * initialize i18n module
 */
i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init(i18nSettings);


export default i18n;

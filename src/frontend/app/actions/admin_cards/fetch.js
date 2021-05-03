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
import Rx from 'rxjs/Rx';

import { AdminCardsAction } from '@utils/actions';


/**
 * fetch all adminCards
 * @param settings = {background: bool}
 *      background - if true -> does not show a notification; else -> show a notification
 * @returns {{type: string, settings: {}}}
 */
const fetchAdminCards = (settings = {}) => {
    return {
        type: AdminCardsAction.FETCH_ADMINCARDS,
        settings,
    };
};

/**
 * fetch all adminCards fulfilled
 * @param adminCards = [{id: number, name: string, link: string}]
 * @param settings = {background: bool}
 *      background - if true -> does not show a notification; else -> show a notification
 * @returns {promise}
 */
const fetchAdminCardsFulfilled = (adminCards, settings = {}) => {
    return Rx.Observable.of({
        type: AdminCardsAction.FETCH_ADMINCARDS_FULFILLED,
        payload: adminCards,
        settings,
    });
};

/**
 * fetch all adminCards rejected
 * @param error
 * @returns {promise}
 */
const fetchAdminCardsRejected = (error) => {
    return Rx.Observable.of({
        type: AdminCardsAction.FETCH_ADMINCARDS_REJECTED,
        payload: error
    });
};

/**
 * fetch all adminCards canceled
 * @param message
 * @returns {{type: string, payload: {}}}
 */
const fetchAdminCardsCanceled = (message) => {
    return {
        type: AdminCardsAction.FETCH_ADMINCARDS_CANCELED,
        payload: message,
    };
};

/**
 * load adminCards' link if exist
 * @param adminCard = {link: string}
 * @param settings = {background: bool}
 *      background - if true -> does not show a notification; else -> show a notification
 * @returns {{type: string, payload: {}, settings: {}}}
 */
const loadAdminCardsLink = (adminCard, settings = {}) => {
    return {
        type: AdminCardsAction.LOAD_ADMINCARD,
        payload: adminCard,
        settings,
    };
};

/**
 * load adminCards' link if exist fulfilled
 * @param adminCards
 * @param settings = {background: bool}
 *      background - if true -> does not show a notification; else -> show a notification
 * @returns {{type: string, payload: [], settings: {}}}
 */
const loadAdminCardsLinkFulfilled = (adminCards, settings = {}) => {
    return {
        type: AdminCardsAction.LOAD_ADMINCARD_FULFILLED,
        payload: adminCards,
        settings
    };
};

/**
 * load adminCards' link if exist rejected
 * @param error
 * @returns {promise}
 */
const loadAdminCardsLinkRejected = (error) => {
    return Rx.Observable.of({
        type: AdminCardsAction.LOAD_ADMINCARD_REJECTED,
        payload: error
    });
};


export {
    fetchAdminCards,
    fetchAdminCardsFulfilled,
    fetchAdminCardsRejected,
    fetchAdminCardsCanceled,
    loadAdminCardsLink,
    loadAdminCardsLinkFulfilled,
    loadAdminCardsLinkRejected,
};
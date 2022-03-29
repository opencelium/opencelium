import React from "react";
import InterpolateTranslation from "../../InterpolateTranslation";
import LinkMessage from "@molecule/link_message/LinkMessage";
import {addInvoker, deleteInvokerByName, importInvoker, updateInvoker} from "@action/InvokerCreators";
import {getActionWithoutType} from "../../../utils";

const IMPORT_INVOKER = (responseType, dispatch, navigate, params) => {
    const {name} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${importInvoker[responseType].type}`}>
            The invoker <LinkMessage dispatch={dispatch} navigate={navigate} link={'invokers'} message={name}/> was successfully imported.
        </InterpolateTranslation>
    );
}
const ADD_INVOKER = (responseType, dispatch, navigate, params) => {
    const {name} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${addInvoker[responseType].type}`}>
            The invoker <LinkMessage dispatch={dispatch} navigate={navigate} link={'invokers'} message={name}/> was successfully added.
        </InterpolateTranslation>
    );
}
const UPDATE_INVOKER = (responseType, dispatch, navigate, params) => {
    const {name} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${updateInvoker[responseType].type}`}>
            The invoker <LinkMessage dispatch={dispatch} navigate={navigate} link={'invokers'} message={name}/> was successfully updated.
        </InterpolateTranslation>
    );
}
const DELETE_INVOKER = (responseType, dispatch, navigate, params) => {
    const {name} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${deleteInvokerByName[responseType].type}`}>
            The invoker <LinkMessage dispatch={dispatch} navigate={navigate} message={name}/> was successfully removed.
        </InterpolateTranslation>
    );
}

export default {
    [getActionWithoutType(importInvoker.fulfilled.type)]: IMPORT_INVOKER,
    [getActionWithoutType(addInvoker.fulfilled.type)]: ADD_INVOKER,
    [getActionWithoutType(updateInvoker.fulfilled.type)]: UPDATE_INVOKER,
    [getActionWithoutType(deleteInvokerByName.fulfilled.type)]: DELETE_INVOKER,
};
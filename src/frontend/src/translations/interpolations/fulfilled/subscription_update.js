import InterpolateTranslation from "@translations/InterpolateTranslation";
import LinkMessage from "@molecule/link_message/LinkMessage";
import React from "react";
import {getResources} from "@action/application/ApplicationCreators";
import {getActionWithoutType} from "../../../utils";

const GET_RESOURCES = (responseType, dispatch, navigate, params) => {
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${getResources[responseType].type}`}>
            New invokers and templates are available (<LinkMessage dispatch={dispatch} navigate={navigate} link={'update_subscription'} message={'updates'} shouldSetSearchValue={false}/>).
        </InterpolateTranslation>
    );
}

export default {
    [getActionWithoutType(getResources.fulfilled.type)]: GET_RESOURCES,
}
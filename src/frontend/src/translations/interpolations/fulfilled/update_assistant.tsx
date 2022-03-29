import React from "react";
import InterpolateTranslation from "@translations/InterpolateTranslation";
import LinkMessage from "@molecule/link_message/LinkMessage";
import {checkForUpdates} from "@action/application/UpdateAssistantCreators";
import {IApplicationResponse} from "@requestInterface/application/IResponse";
import {CheckForUpdateProps} from "@requestInterface/application/IUpdateAssistant";
import {NotificationType} from "@interface/application/INotification";
import {getActionWithoutType} from "../../../utils";
import {NavigateFunction} from "react-router";
import {AppDispatch} from "@store/store";

const GET_LAST_AVAILABLE_VERSION = (responseType: NotificationType, dispatch: AppDispatch, navigate: NavigateFunction, params: IApplicationResponse<CheckForUpdateProps>) => {
    // @ts-ignore
    return (<InterpolateTranslation i18nKey={`notifications.${responseType}.${checkForUpdates[responseType].type}`}>
            OC Update <LinkMessage dispatch={dispatch} navigate={navigate} link={'update_assistant'} message={params.data.version} shouldSetSearchValue={false}/> available.
        </InterpolateTranslation>
    );
}

export default {
    [getActionWithoutType(checkForUpdates.fulfilled.type)]: GET_LAST_AVAILABLE_VERSION,
}
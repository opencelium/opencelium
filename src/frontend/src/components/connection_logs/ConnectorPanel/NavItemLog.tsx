import React from 'react';
import {TextSize} from "@app_component/base/text/interfaces";
import {ColorTheme} from "@style/Theme";
import {copyStringToClipboard} from "@application/utils/utils";
import {copyWebhookToClipboard} from "@entity/schedule/redux_toolkit/slices/ScheduleSlice";
import Button from "@app_component/base/button/Button";
import {useAppDispatch} from "@application/utils/store";

const CopyLogContent = (props: {content: string}) => {
    const dispatch = useAppDispatch();
    return (
        <Button
            iconSize={TextSize.Size_12}
            icon={'file_copy'}
            hasBackground={false}
            color={ColorTheme.Turquoise}
            handleClick={() => {
                copyStringToClipboard(props.content);
                dispatch(copyWebhookToClipboard())
            }}
        />
    )
}

export default CopyLogContent;

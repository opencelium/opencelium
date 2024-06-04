import React, {useEffect, useState} from 'react';
import {TooltipButton} from "@app_component/base/tooltip_button/TooltipButton";
import {TextSize} from "@app_component/base/text/interfaces";
import {VersionProps} from "@application/requests/interfaces/IUpdateAssistant";
import {RootState, useAppDispatch, useAppSelector} from "@application/utils/store";
//@ts-ignore
import styles from "@entity/connection/components/themes/default/content/update_assistant/main";
import {
    downloadOnlineVersion, getOfflineUpdates,
} from "@entity/update_assistant/redux_toolkit/action_creators/UpdateAssistantCreators";
import RadioButtons from "@basic_components/inputs/RadioButtons";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";

const DownloadOnlineVersionIcon = ({version, callback}: {version: VersionProps, callback: (version: VersionProps) => void}) => {
    const dispatch = useAppDispatch();
    const {downloadingOnlineVersion, downloadedOnlineUpdate, gettingOfflineUpdates} = useAppSelector((state: RootState) => state.updateAssistantReducer);
    const [isDownloading, toggleDownloading] = useState<boolean>(false);
    const [isDownloaded, toggleDownloaded] = useState<boolean>(false);
    const [isGettingOfflineUpdates, toggleGettingOfflineUpdates] = useState<boolean>(false);
    const download = () => {
        toggleGettingOfflineUpdates(true);
        dispatch(getOfflineUpdates());
    }
    useEffect(() => {
        if (gettingOfflineUpdates === API_REQUEST_STATE.FINISH && isGettingOfflineUpdates) {
            toggleGettingOfflineUpdates(false);
            toggleDownloading(true);
            dispatch(downloadOnlineVersion(version.name))
        }
    }, [gettingOfflineUpdates]);
    useEffect(() => {
        if(downloadingOnlineVersion === API_REQUEST_STATE.FINISH && isDownloading) {
            toggleDownloading(false);
            toggleDownloaded(true);
            callback(downloadedOnlineUpdate);
        }
    }, [downloadingOnlineVersion]);
    if (isDownloaded) {
       return (
           <RadioButtons
               label={''}
               value={version.name}
               style={{textAlign: 'center'}}
               radios={[{
                   label: '',
                   value: version.name,
                   inputClassName: styles.radio_input,
                   labelClassName: styles.radio_label,
               }]}/>
       )
    }
    return (
        <TooltipButton
            size={TextSize.Size_18}
            isLoading={isDownloading}
            position={'bottom'}
            icon={'download'}
            tooltip={'Download'}
            target={`download_version_${version.name}`}
            hasBackground={false}
            handleClick={download}
        />
    )
}

export default DownloadOnlineVersionIcon;

import React, {useEffect, useState} from 'react';
import Button from "@app_component/base/button/Button";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import Dialog from "@basic_components/Dialog";
import InputFile from "@app_component/base/input/file/InputFile";
import Subscription from "@entity/license_management/classes/Subscription";
import {useAppDispatch} from "@application/utils/store";
import {
    getCurrentSubscription,
    importCredits
} from "@entity/license_management/redux_toolkit/action_creators/SubscriptionCreators";

const ImportCreditsComponent = () => {
    const dispatch = useAppDispatch();
    const {importingCredits} = Subscription.getReduxState();
    const [showDialog, toggleDialog] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [creditFile, setCreditFile] = useState<any>();
    const upload = () => {
        dispatch(importCredits(creditFile));
    }
    useEffect(() => {
        if (importingCredits === API_REQUEST_STATE.FINISH) {
            toggleDialog(false);
        }
    }, [importingCredits])
    return (
        <div style={{display: 'inline-block'}}>
            <Dialog
                actions={[
                    {id: 'import', label: 'Upload', onClick: upload, isLoading: importingCredits === API_REQUEST_STATE.START},
                    {id: 'cancel', label: 'Cancel', onClick: () => toggleDialog(false)}]}
                title={'Upload Extra Ops'} active={showDialog} toggle={() => toggleDialog(!showDialog)}>
                <InputFile
                    id={`input_credit_file`}
                    error={error}
                    onChange={(file) => setCreditFile([file])}
                    value={creditFile}
                    label={'Extra Ops File'}
                    icon={'lock_outline'}
                    hasNoImage={false}
                    hasCrop={false}
                    accept={'.txt'}
                    buttonProps={{label: '', iconSize: '18px'}}
                />
            </Dialog>
            <Button
                id={'license-management-extra-ops'}
                label={'Extra Ops'}
                icon={'library_add'}
                handleClick={() => toggleDialog(true)}
                isLoading={importingCredits === API_REQUEST_STATE.START}
            />
        </div>
    )
}

export default ImportCreditsComponent;

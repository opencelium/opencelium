import React, {useEffect, useState} from 'react';
import {TextSize} from "@app_component/base/text/interfaces";
import {Auth} from "@application/classes/Auth";
import {useAppDispatch} from "@application/utils/store";
import {TooltipButton} from "@app_component/base/tooltip_button/TooltipButton";
import {getAllMetaConnectionsByInvokerName} from "@root/redux_toolkit/action_creators/ConnectionCreators";
import {Dialog} from "@app_component/base/dialog/Dialog";
import {Connection} from "@root/classes/Connection";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {ConnectionPermissions} from "@root/constants";
import Connections from "@root/collections/Connections";
import {CollectionView} from "@app_component/collection/collection_view/CollectionView";
import Hint from "@app_component/base/hint/Hint";
import {Invoker} from "@entity/invoker/classes/Invoker";
import {syncInvokerWithSP} from "@entity/invoker/redux_toolkit/action_creators/InvokerCreators";
import {Application} from "@application/classes/Application";

const SyncButton = ({invoker}: any) => {
    const dispatch = useAppDispatch();
    const {onlineServiceStatus} = Application.getReduxState();
    const {syncingInvokerWithSP} = Invoker.getReduxState();
    const {gettingAllMetaConnectionsByInvokerName, metaConnectionsByInvokerName} = Connection.getReduxState();
    const [startGetting, setStartGetting] = useState<boolean>(false);
    const [startSyncing, setStartSyncing] = useState<boolean>(false);
    const [shouldBeUpdated, setShouldBeUpdated] = useState(false);
    const {authUser} = Auth.getReduxState();
    const [showDialog, toggle] = useState<boolean>(false);

    useEffect(() => {
        setShouldBeUpdated(!shouldBeUpdated);
    }, [metaConnectionsByInvokerName])
    useEffect(() => {
        if (startGetting) {
            if (gettingAllMetaConnectionsByInvokerName === API_REQUEST_STATE.FINISH) {
                setStartGetting(false);
                toggle(true);
            }
        }
    }, [gettingAllMetaConnectionsByInvokerName]);
    useEffect(() => {
        if (startSyncing) {
            if (syncingInvokerWithSP === API_REQUEST_STATE.FINISH) {
                setStartSyncing(false);
                toggle(false);
            }
        }
    }, [syncingInvokerWithSP]);
    const sync = () => {
        setStartSyncing(true);
        dispatch(syncInvokerWithSP(invoker.name));
    }
    let actions = [
        {label: 'Sync', onClick: sync, id: 'sync', isLoading: startSyncing},
        {label: 'Cancel', onClick: toggle, id: 'cancel'}
    ];
    if (!invoker.hasManualSync) {
        return null;
    }
    const isDisabled = !(onlineServiceStatus?.invoker_sync.active && onlineServiceStatus?.active);
    const CConnections = new Connections(metaConnectionsByInvokerName, dispatch, API_REQUEST_STATE.INITIAL, API_REQUEST_STATE.INITIAL, true, true, true);
    return (
        <React.Fragment>
            <TooltipButton
                target={`sync_entity_${invoker.id}`}
                position={'top'}
                tooltip={isDisabled ? 'Please, activate online service in application.yml file' : 'Sync with Service Portal'}
                handleClick={() => {
                    dispatch(getAllMetaConnectionsByInvokerName(invoker.name));
                    setStartGetting(true);
                }}
                isDisabled={isDisabled}
                hasBackground={false}
                icon={'cloud_sync'}
                background={isDisabled ? '#999' : '#ed6868'}
                isLoading={startGetting}
                size={TextSize.Size_20}
            />
            <Dialog
                actions={actions}
                active={showDialog}
                toggle={toggle}
                title={`Force sync ${invoker.name} with Service Portal`}
                styles={{modal: {minWidth: '60%'}, body: {minHeight: '400px'}}}
            >
                <Hint style={{margin: '20px 0'}} message={"These connections will be affected by syncing this invoker file with the Service Portal."}/>
                <CollectionView isListViewCard={false} hasTopBar={false} hasTitle={false} hasViewSection={false} collection={CConnections} shouldBeUpdated={shouldBeUpdated} isLoading={gettingAllMetaConnectionsByInvokerName === API_REQUEST_STATE.START} componentPermission={ConnectionPermissions}/>
            </Dialog>
        </React.Fragment>
    )
}

export default SyncButton;

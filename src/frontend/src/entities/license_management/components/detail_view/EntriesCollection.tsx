import React, {useEffect, useState} from 'react';
import {ConnectionPermissions} from "@root/constants";
import {CollectionView} from "@app_component/collection/collection_view/CollectionView";
import OperationUsageEntries from "@entity/license_management/collections/OperationUsageEntries";
import Subscription from "@entity/license_management/classes/Subscription";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {
    getOperationUsageEntries
} from "@entity/license_management/redux_toolkit/action_creators/SubscriptionCreators";
import {useAppDispatch} from "@application/utils/store";

const EntriesPerPage = 3;
const EntriesCollection = ({currentEntry, setCurrentEntry, collection, setCollection, entryPage, setEntryPage}: any) => {
    const dispatch = useAppDispatch();
    const {
        gettingOperationUsageEntries, gettingOperationUsageDetails,
        operationUsageEntries, currentSubscription,
        entriesTotalPages,
    } = Subscription.getReduxState();
    const [entriesShouldBeUpdated, setEntriesShouldBeUpdated] = useState(false);
    const entries = new OperationUsageEntries(operationUsageEntries);
    useEffect(() => {
        setEntriesShouldBeUpdated(!entriesShouldBeUpdated);
    }, [operationUsageEntries, currentEntry])
    const isLoading = gettingOperationUsageDetails === API_REQUEST_STATE.START || gettingOperationUsageEntries === API_REQUEST_STATE.START;

    useEffect(() => {
        const {startDate, endDate} = Subscription.getMonthlyPeriod(currentSubscription.startDate)
        dispatch(getOperationUsageEntries({page: entryPage, size: EntriesPerPage, startDate, endDate}));
    }, [entryPage])
    useEffect(() => {
        if (!currentEntry) {
            const {startDate, endDate} = Subscription.getMonthlyPeriod(currentSubscription.startDate)
            dispatch(getOperationUsageEntries({page: entryPage, size: EntriesPerPage, startDate, endDate}));
        } else {
            setCollection('details');
        }
    }, [currentEntry])
    return (
        <CollectionView
            hasNotAlert={true}
            hasViewSection={false}
            isListViewCard={false}
            hasTitle={false}
            hasTopBar={false}
            collection={entries}
            shouldBeUpdated={entriesShouldBeUpdated}
            componentPermission={ConnectionPermissions}
            onListRowClick={(entity) => {setCurrentEntry(entity)}}
            isLoading={isLoading}
            paginationProps={{
                totalPages: entriesTotalPages,
                setPage: (newPage: number) => {
                    setEntryPage(newPage);
                },
                page: entryPage,
            }}
        />
    )
}
export default EntriesCollection;

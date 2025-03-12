import React, {useEffect, useState} from 'react';
import {CollectionView} from "@app_component/collection/collection_view/CollectionView";
import {ConnectionPermissions} from "@root/constants";
import OperationUsageDetails from "@entity/license_management/collections/OperationUsageDetails";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import Subscription from "@entity/license_management/classes/Subscription";
import {
    getOperationUsageDetails,
} from "@entity/license_management/redux_toolkit/action_creators/SubscriptionCreators";
import {useAppDispatch} from "@application/utils/store";

const DetailsPerPage = 3;
const DetailsCollection = ({currentEntry, detailsPage, setDetailsPage, setCollection}: any) => {
    const dispatch = useAppDispatch();
    const {
        gettingOperationUsageEntries, gettingOperationUsageDetails,
        operationUsageDetails, operationUsageEntries,
        entriesTotalPages, detailsTotalPages,
    } = Subscription.getReduxState();
    const details = new OperationUsageDetails(operationUsageDetails);
    const isLoading = gettingOperationUsageDetails === API_REQUEST_STATE.START || gettingOperationUsageEntries === API_REQUEST_STATE.START;

    const [detailsShouldBeUpdated, setDetailsShouldBeUpdated] = useState(false);
    useEffect(() => {
        setDetailsShouldBeUpdated(!detailsShouldBeUpdated);
    }, [operationUsageDetails, currentEntry])
    useEffect(() => {
        if (currentEntry) {
            dispatch(getOperationUsageDetails({entryId: currentEntry.id, page: detailsPage, size: DetailsPerPage}));
        }
    }, [detailsPage])
    useEffect(() => {
        if (currentEntry) {
            if (detailsPage !== 0) {
                setDetailsPage(0);
            } else {
                dispatch(getOperationUsageDetails({entryId: currentEntry.id, page: detailsPage, size: DetailsPerPage}));
            }
        } else {
            setCollection('entries');
            setDetailsPage(0);
        }
    }, [currentEntry])
    return (
        <CollectionView
            hasNotAlert={true}
            hasViewSection={false}
            isListViewCard={false}
            hasTopBar={false}
            collection={details}
            isLoading={isLoading}
            shouldBeUpdated={detailsShouldBeUpdated}
            componentPermission={ConnectionPermissions}
            paginationProps={{
                totalPages: detailsTotalPages,
                setPage: (newPage: number) => {
                    setDetailsPage(newPage);
                },
                page: detailsPage,
            }}
        />
    )
}

export default DetailsCollection;

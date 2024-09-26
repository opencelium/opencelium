/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {FC, useEffect, useState} from 'react';
import {useAppDispatch} from "@application/utils/store";
import Subscription from "@entity/license_management/classes/Subscription";
import {
    getOperationUsageDetails,
    getOperationUsageEntries
} from "@entity/license_management/redux_toolkit/action_creators/SubscriptionCreators";
import OperationUsageEntries from "@entity/license_management/collections/OperationUsageEntries";
import {CollectionView} from "@app_component/collection/collection_view/CollectionView";
import OperationUsageDetails from "@entity/license_management/collections/OperationUsageDetails";
import Button from "@app_component/base/button/Button";
import {ConnectorPermissions} from "@entity/connector/constants";
import {OperationUsageEntryModel} from "@entity/license_management/requests/models/SubscriptionModel";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {Loading} from "@app_component/base/loading/Loading";
const EntriesPerPage = 5;
const DetailsPerPage = 5;
const DetailView = () => {
    const dispatch = useAppDispatch();
    const {
        gettingOperationUsageEntries, gettingOperationUsageDetails,
        operationUsageDetails, operationUsageEntries,
        entriesTotalPages, detailsTotalPages,
    } = Subscription.getReduxState();
    const [page, setPage] = useState<'entries' | 'details'>('entries');
    const [currentEntry, setCurrentEntry] = useState<null | OperationUsageEntryModel>(null);
    const [detailsShouldBeUpdated, setDetailsShouldBeUpdated] = useState(false);
    const [entriesShouldBeUpdated, setEntriesShouldBeUpdated] = useState(false);
    const [entryPage, setEntryPage] = useState<number>(0);
    const [detailsPage, setDetailsPage] = useState<number>(0);
    useEffect(() => {
        if (currentEntry) {
            setPage('details');
            if (detailsPage !== 0) {
                setDetailsPage(0);
            } else {
                dispatch(getOperationUsageDetails({entryId: currentEntry.id, page: detailsPage === 0 ? 0 : detailsPage - 1, size: DetailsPerPage}));
            }
        } else {
            setPage('entries');
            dispatch(getOperationUsageEntries({page: entryPage === 0 ? 0 : entryPage - 1, size: EntriesPerPage}));
        }
    }, [currentEntry])
    useEffect(() => {
        if (currentEntry) {
            dispatch(getOperationUsageDetails({entryId: currentEntry.id, page: detailsPage === 0 ? 0 : detailsPage - 1, size: DetailsPerPage}));
        }
    }, [detailsPage])
    useEffect(() => {
        dispatch(getOperationUsageEntries({page: detailsPage === 0 ? 0 : detailsPage - 1, size: DetailsPerPage}));
    }, [entryPage])
    useEffect(() => {
        setDetailsShouldBeUpdated(!detailsShouldBeUpdated);
    }, [operationUsageDetails, currentEntry])
    useEffect(() => {
        setEntriesShouldBeUpdated(!entriesShouldBeUpdated);
    }, [operationUsageEntries, currentEntry])
    const entries = new OperationUsageEntries(operationUsageEntries);
    const details = new OperationUsageDetails(operationUsageDetails);
    const isLoading = gettingOperationUsageDetails === API_REQUEST_STATE.START || gettingOperationUsageEntries === API_REQUEST_STATE.START;
    const EntriesCollection =
        <CollectionView
            hasViewSection={false}
            isListViewCard={false}
            hasTitle={false}
            hasTopBar={false}
            collection={entries}
            shouldBeUpdated={entriesShouldBeUpdated}
            componentPermission={ConnectorPermissions}
            onListRowClick={(entity) => {setCurrentEntry(entity)}}
            isLoading={isLoading}
            paginationProps={{
                totalPages: entriesTotalPages,
                setPage: (newPage: number) => {
                    setEntryPage(newPage);
                }
            }}
        />;
    const DetailsCollection =
        <CollectionView
            isLoading={isLoading}
            hasViewSection={false}
            isListViewCard={false}
            hasTopBar={false}
            collection={details}
            shouldBeUpdated={detailsShouldBeUpdated}
            componentPermission={ConnectorPermissions}
            paginationProps={{
                totalPages: detailsTotalPages,
                setPage: (newPage: number) => {
                    setDetailsPage(newPage);
                }
            }}
        />;
    const collection = page === 'entries' ? EntriesCollection : DetailsCollection;
    return (
        <div style={{marginLeft: '20px'}}>
            {page === 'details' &&
                <div style={{width: '100%'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <div style={{fontSize: '20px'}}>
                            {currentEntry?.connectionTitle || ''}
                        </div>
                        <Button
                            key={'back_button'}
                            icon={'arrow_left'}
                            iconSize={'40px'}
                            hasBackground={false}
                            handleClick={() => {setCurrentEntry(null)}}
                        />
                    </div>
                </div>
            }
            {collection}
        </div>
    )
}


export {
    DetailView,
};

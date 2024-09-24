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
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import OperationUsageDetails from "@entity/license_management/collections/OperationUsageDetails";
import Button from "@app_component/base/button/Button";
import {ConnectorPermissions} from "@entity/connector/constants";
import {OperationUsageEntryModel} from "@entity/license_management/requests/models/SubscriptionModel";

const DetailView = () => {
    const dispatch = useAppDispatch();
    const {
        gettingOperationUsageDetails, gettingOperationUsageEntries,
        operationUsageDetails, operationUsageEntries
    } = Subscription.getReduxState();
    const [page, setPage] = useState<'entries' | 'details'>('entries');
    const [currentEntry, setCurrentEntry] = useState<null | OperationUsageEntryModel>(null);
    const [detailsShouldBeUpdated, setDetailsShouldBeUpdated] = useState(false);
    const [entriesShouldBeUpdated, setEntriesShouldBeUpdated] = useState(false);
    useEffect(() => {
        if (currentEntry) {
            setPage('details');
            dispatch(getOperationUsageDetails(currentEntry.id));
        } else {
            setPage('entries');
            dispatch(getOperationUsageEntries());
        }
    }, [currentEntry])
    useEffect(() => {
        setDetailsShouldBeUpdated(!detailsShouldBeUpdated);
    }, [operationUsageDetails, currentEntry])
    useEffect(() => {
        setEntriesShouldBeUpdated(!entriesShouldBeUpdated);
    }, [operationUsageEntries, currentEntry])
    const entries = new OperationUsageEntries(operationUsageEntries);
    const details = new OperationUsageDetails(operationUsageDetails);
    const EntriesCollection =
        <CollectionView
            hasViewSection={false}
            isListViewCard={false}
            hasTitle={false}
            hasTopBar={false}
            collection={entries}
            shouldBeUpdated={entriesShouldBeUpdated}
            isLoading={gettingOperationUsageEntries === API_REQUEST_STATE.START}
            componentPermission={ConnectorPermissions}
            onListRowClick={(entity) => {setCurrentEntry(entity)}}
        />;
    const DetailsCollection =
        <CollectionView
            hasViewSection={false}
            isListViewCard={false}
            hasTopBar={false}
            collection={details}
            shouldBeUpdated={detailsShouldBeUpdated}
            isLoading={gettingOperationUsageDetails === API_REQUEST_STATE.START}
            componentPermission={ConnectorPermissions}
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

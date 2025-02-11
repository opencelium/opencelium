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
import {RootState, useAppDispatch, useAppSelector} from "@application/utils/store";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {permission} from "@entity/application/utils/permission";
import CollectionView from "@app_component/collection/collection_view/CollectionView";
import {getSupportFiles} from "@root/redux_toolkit/action_creators/SupportFileCreators";
import {SupportFilesListProps} from "@entity/support_files/components/pages/interfaces";
import {ConnectionPermissions} from "@root/constants";
import SupportFiles from "@entity/support_files/collections/SupportFiles";

const SupportFilesList: FC<SupportFilesListProps> = permission(ConnectionPermissions.READ)(({}) => {
    const dispatch = useAppDispatch();
    const {gettingSupportFiles, supportFileResponses, error} = useAppSelector((state: RootState) => state.supportFileReducer);
    const [shouldBeUpdated, setShouldBeUpdated] = useState(false);
    useEffect(() => {
        dispatch(getSupportFiles());
    }, []);
    useEffect(() => {
        setShouldBeUpdated(!shouldBeUpdated);
    }, [supportFileResponses])
    const CSupportFiles = new SupportFiles(supportFileResponses);
    return (
        <CollectionView
            hasViewSection={false}
            collection={CSupportFiles}
            shouldBeUpdated={shouldBeUpdated}
            hasError={!!error}
            isLoading={gettingSupportFiles === API_REQUEST_STATE.START}
            componentPermission={ConnectionPermissions}
        />
    )
})

SupportFilesList.defaultProps = {
}

export {
    SupportFilesList,
};

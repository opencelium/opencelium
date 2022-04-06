/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {FC, useEffect, useState} from 'react';
import {InvokerListProps} from "./interfaces";
import Invokers from "@collection/Invokers";
import {Invoker} from "@class/invoker/Invoker";
import {CollectionView} from "@organism/collection_view/CollectionView";
import {useAppDispatch} from "../../../hooks/redux";
import {getAllInvokers} from "@action/InvokerCreators";
import {API_REQUEST_STATE} from "@interface/application/IApplication";
import {InvokerPermissions} from "@constants/permissions";
import {permission} from "../../../decorators/permission";

const InvokerList: FC<InvokerListProps> = permission(InvokerPermissions.READ)(({}) => {
    const dispatch = useAppDispatch();
    const {gettingInvokers, invokers, deletingInvokersById, uploadingInvokerImage} = Invoker.getReduxState();
    const [shouldBeUpdated, setShouldBeUpdated] = useState(false);
    useEffect(() => {
        dispatch(getAllInvokers());
    }, [])
    useEffect(() => {
        setShouldBeUpdated(!shouldBeUpdated);
    }, [invokers])
    const CInvokers = new Invokers(invokers, dispatch, deletingInvokersById, uploadingInvokerImage);
    return (
        <CollectionView collection={CInvokers} shouldBeUpdated={shouldBeUpdated} isLoading={gettingInvokers === API_REQUEST_STATE.START} componentPermission={InvokerPermissions}/>
    )
})

InvokerList.defaultProps = {
}

export {
    InvokerList,
};
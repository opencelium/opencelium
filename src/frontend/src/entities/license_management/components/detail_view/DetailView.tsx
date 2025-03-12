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

import React, {useState} from 'react';
import Button from "@app_component/base/button/Button";
import {OperationUsageEntryModel} from "@entity/license_management/requests/models/SubscriptionModel";
import EntriesCollection from "@entity/license_management/components/detail_view/EntriesCollection";
import DetailsCollection from "@entity/license_management/components/detail_view/DetailsCollection";
const DetailView = () => {
    const [collection, setCollection] = useState<'entries' | 'details'>('entries');
    const [currentEntry, setCurrentEntry] = useState<null | OperationUsageEntryModel>(null);
    const [entryPage, setEntryPage] = useState<number>(0);
    const [detailsPage, setDetailsPage] = useState<number>(0);
    return (
        <div style={{marginLeft: '20px'}}>
            {collection === 'details' &&
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
            {collection === 'entries'
                ?
                <EntriesCollection
                    setCollection={setCollection}
                    currentEntry={currentEntry}
                    setCurrentEntry={setCurrentEntry}
                    entryPage={entryPage}
                    setEntryPage={setEntryPage}
                />
            :
                <DetailsCollection
                    setCollection={setCollection}
                    currentEntry={currentEntry}
                    detailsPage={detailsPage}
                    setDetailsPage={setDetailsPage}
                />
            }
        </div>
    )
}


export {
    DetailView,
};

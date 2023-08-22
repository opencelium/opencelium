import React, {FC, useState} from 'react';
import {
    DataAggregatorProps
} from "./interfaces";
import Dialog from "@basic_components/Dialog";


const DataAggregator:FC<DataAggregatorProps> = ({}) => {
    const [showDialog, setShowDialog] = useState<boolean>(false);

    const saveDataAggregator = () => {

    }

    return (
        <React.Fragment>
            <Dialog
                actions={[
                    {label: 'Save', id: 'save_data_aggregator', onClick: () => saveDataAggregator()},
                    {label: 'Close', id: 'close_data_aggregator', onClick: () => setShowDialog(!showDialog)},
                ]}
                active={showDialog}
                toggle={() => setShowDialog(!showDialog)}
                title={'Set Data Aggregators'}
            >

            </Dialog>
        </React.Fragment>
    )
}

export default DataAggregator;

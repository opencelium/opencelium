import { ConnectorLog } from "@root/requests/models/ConnectionLog";
import { ITheme } from '@style/Theme';
import React from 'react';
import styles from './ConnectorPanel.module.css';
import TraceItem from './TraceItem/TraceItem';
import {RootState, useAppSelector} from "@application/utils/store";
import {Loading} from "@app_component/base/loading/Loading";
import {withTheme} from "styled-components";

interface ConnectorPanelProps {
	connector: ConnectorLog;
	executionId: string;
	theme?: ITheme;
}

const ConnectorPanel: React.FC<ConnectorPanelProps> = ({
	connector,
	executionId,
	theme
}) => {
	const {isTesting, isFinished, isForcedFinished} = useAppSelector((state: RootState) => state.connectionLogReducer);
	return (
		<div className={styles.connectorPanel} style={{width: '100%'}}>
			<h3 className={styles.connectorPanelTitle}>{connector.name}</h3>
			{connector.traces.length === 0 && isTesting && !isFinished && !isForcedFinished && <Loading/>}
			{connector.traces.map((trace) => (
				<div key={`${trace.flowId}_${trace.indexPath}`} className={styles.traceItemContainer}>
					<TraceItem
						trace={trace}
						flowId={connector.flowId}
						executionId={executionId}
						iterationIndexes={[]}
						theme={theme}
					/>
				</div>
			))}
		</div>
	);
};

export default withTheme(ConnectorPanel);

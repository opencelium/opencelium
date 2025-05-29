import { ConnectorLog } from "@root/requests/models/ConnectionLog";
import { ITheme } from '@style/Theme';
import React from 'react';
import styles from './ConnectorPanel.module.css';
import TraceItem from './TraceItem/TraceItem';

interface ConnectorPanelProps {
	connector: ConnectorLog;
	executionId: string;
	connectionId: string;
	theme?: ITheme;
}

const ConnectorPanel: React.FC<ConnectorPanelProps> = ({
	connector,
	executionId,
	connectionId,
	theme
}) => {
	return (
		<div className={styles.connectorPanel}>
			<h3 className={styles.connectorPanelTitle}>{connector.name}</h3>
			{connector.traces.map((trace) => (
				<div key={trace.indexPath} className={styles.traceItemContainer}>
					<TraceItem
						trace={trace}
						connectorId={connector.id}
						executionId={executionId}
						connectionId={connectionId}
						iterationIndexes={[]}
						theme={theme}
					/>
				</div>
			))}
		</div>
	);
};

export default ConnectorPanel;

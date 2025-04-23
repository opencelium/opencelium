import React from 'react';
import { ConnectorLog } from '../../connection/requests/models/ConnectionLog';
import styles from './ConnectorPanel.module.css';
import TraceItem from './TraceItem/TraceItem';

interface ConnectorPanelProps {
	connector: ConnectorLog;
	executionId: string;
	connectionId: string;
}

const ConnectorPanel: React.FC<ConnectorPanelProps> = ({
	connector,
	executionId,
	connectionId,
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
					/>
				</div>
			))}
		</div>
	);
};

export default ConnectorPanel;

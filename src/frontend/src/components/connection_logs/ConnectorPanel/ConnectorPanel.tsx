import { ConnectorLog } from "@root/requests/models/ConnectionLog";
import { ITheme } from '@style/Theme';
import React from 'react';
import styles from './ConnectorPanel.module.css';
import TraceItem from './TraceItem/TraceItem';

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
	return (
		<div className={styles.connectorPanel} style={{width: '100%'}}>
			<h3 className={styles.connectorPanelTitle}>{connector.name}</h3>
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

export default ConnectorPanel;

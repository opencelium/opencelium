import React, { useState } from 'react';
import { FaTrash } from 'react-icons/fa';
import { useAppDispatch, useAppSelector } from '../../storeHooks';
import { deleteLogs } from '../connection/redux_toolkit/action_creators/ConnectionLogCreators';
import { ConnectionLog } from '../connection/requests/models/ConnectionLog';
import ConnectorPanel from './ConnectorPanel/ConnectorPanel';
import styles from './LogsPanel.module.css';

const TrashIcon = FaTrash as React.FC<React.SVGProps<SVGSVGElement>>;

const LogsPanel: React.FC = () => {
  const dispatch = useAppDispatch();

  const connectionLog = useAppSelector((state) => state.connectionLog) as ConnectionLog;
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteLogs = async (executionId: string, connectionId: string) => {
    setIsDeleting(true);
    await dispatch(deleteLogs({ executionId, connectionId }));
    setIsDeleting(false);
  };

  return (
    <div className={styles.logsPanel}>
      <div className={styles.logsPanelContainer}>
        <div className={styles.logsPanelHeader}>
          <h2 className={styles.logsPanelTitle}>Logs</h2>
          <button
            onClick={() =>
              handleDeleteLogs(connectionLog.executionId, connectionLog.connectionId)
            }
            disabled={isDeleting}
            className={styles.deleteLogsButton}
          >
            {isDeleting ? 'Deleting...' : <TrashIcon />}
          </button>
        </div>
        <div>
          {connectionLog.connectors.map((connector) => (
            <ConnectorPanel
              key={connector.id}
              connector={connector}
              executionId={connectionLog.executionId}
              connectionId={connectionLog.connectionId}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LogsPanel;

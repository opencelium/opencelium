import React, { useState } from 'react';
import ConnectorPanel from './ConnectorPanel/ConnectorPanel';
import styles from './LogsPanel.module.css';
import {deleteLogs} from "@root/redux_toolkit/action_creators/ConnectionLogCreators";
import {RootState, useAppDispatch, useAppSelector} from "@application/utils/store";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
export const ShowIndexPath = false;
const LogsPanel: React.FC = () => {
  const dispatch = useAppDispatch();

  const connectionLog = useAppSelector((state: RootState) => state.connectionLogReducer);
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
            {isDeleting ? 'Deleting...' : <TooltipFontIcon size={14} tooltip={'Delete'} value={'delete'} className={styles.remove_icon} onClick={() => {}}/>}
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

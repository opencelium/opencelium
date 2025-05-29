import { TextSize } from "@app_component/base/text/interfaces";
import { Application } from "@application/classes/Application";
import { RootState, useAppDispatch, useAppSelector } from "@application/utils/store";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import {
  ClearButtonStyled,
  HeaderStyled, LogPanelStyled, TopStyled
} from "@change_component/form_elements/form_connection/form_svg/layouts/logs/styles";
import { Connection } from "@root/classes/Connection";
import { deleteLogs } from "@root/redux_toolkit/action_creators/ConnectionLogCreators";
import { ITheme } from '@style/Theme';
import React, { useState } from 'react';
import ConnectorPanel from './ConnectorPanel/ConnectorPanel';
export const ShowIndexPath = false;

interface LogsPanelProps {
  theme?: ITheme;
}

const LogsPanel: React.FC<LogsPanelProps> = ({theme}) => {
  const dispatch = useAppDispatch();
  const connectionLog = useAppSelector((state: RootState) => state.connectionLogReducer);
  const {
    logPanelHeight, isDetailsOpened
  } = Connection.getReduxState();
  const {isFullScreen} = Application.getReduxState();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteLogs = async (executionId: string, connectionId: string) => {
    setIsDeleting(true);
    await dispatch(deleteLogs({ executionId, connectionId }));
    setIsDeleting(false);
  };

  return (
    <React.Fragment>
        <TopStyled logPanelHeight={logPanelHeight}>
          {logPanelHeight !== 0 && <HeaderStyled id={'test_execution_process'} value={'Logs'} width={isDetailsOpened ? 'calc(100% - 300px)' : '100%'}/>}
          {logPanelHeight !== 0 && <ClearButtonStyled
              right={isDetailsOpened ? isFullScreen ? 312 : 300 : isFullScreen ? 12 : 2}
              iconSize={TextSize.Size_20}
              position={'right'}
              isDisabled={isDeleting || connectionLog.connectors.length === 0}
              icon={'delete'}
              tooltip={'Clear Logs'}
              target={`clear_log_panel`}
              hasBackground={false}
              handleClick={() => handleDeleteLogs(connectionLog.executionId, connectionLog.connectionId)}
          />}
        </TopStyled>
      <LogPanelStyled id={'connection_current_logs'} isFullScreen={isFullScreen} noLogs={connectionLog.connectors.length === 0} isDetailsOpened={isDetailsOpened} logPanelHeight={logPanelHeight}>
          {connectionLog.connectors.map((connector) => (
            <ConnectorPanel
              key={connector.id}
              connector={connector}
              executionId={connectionLog.executionId}
              connectionId={connectionLog.connectionId}
              theme={theme}
            />
          ))}
      </LogPanelStyled>
    </React.Fragment>
  );
};

export default LogsPanel;

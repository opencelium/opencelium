import { TextSize } from "@app_component/base/text/interfaces";
import { Application } from "@application/classes/Application";
import { RootState, useAppDispatch, useAppSelector } from "@application/utils/store";
import {
    ClearButtonStyled, EmptyLogsStyled, FinishedLogsStyled, ForcedFinishedLogsStyled, FullLogsButtonStyled,
    HeaderStyled, LogPanelStyled, TopStyled
} from "@change_component/form_elements/form_connection/form_svg/layouts/logs/styles";
import { Connection } from "@root/classes/Connection";
import {ColorTheme, ITheme} from '@style/Theme';
import React, { useState } from 'react';
import {clearSocketLog, clearTextLog} from "@root/redux_toolkit/slices/ConnectionLogSlice";
import LogViewer from "@app_component/connection_logs/TextLog";
import {deleteLogs} from "@root/redux_toolkit/action_creators/ConnectionLogCreators";
import ConnectorPanel from "@app_component/connection_logs/ConnectorPanel/ConnectorPanel";
import {PermissionTooltipButton} from "@app_component/base/button/PermissionButton";
import {TooltipButton} from "@app_component/base/tooltip_button/TooltipButton";
import {LogPanelHeight, setLogPanelHeight} from "@root/redux_toolkit/slices/ConnectionSlice";
import {setFullScreen} from "@application/redux_toolkit/slices/ApplicationSlice";
export const ShowIndexPath = false;

interface LogsPanelProps {
  theme?: ITheme;
}
function formatDuration(ms: number): string {
    const milliseconds = ms % 1000;
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (1000 * 60)) % 60;
    const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    const parts: string[] = [];
    if (days > 0) parts.push(`${days} d`);
    if (hours > 0) parts.push(`${hours} h`);
    if (minutes > 0) parts.push(`${minutes} m`);
    if (seconds > 0) parts.push(`${seconds} s`);
    if (minutes === 0 && milliseconds > 0) parts.push(`${milliseconds} ms`);

    return parts.join(" ");
}

const LogsPanel: React.FC<LogsPanelProps> = ({theme}) => {
  const dispatch = useAppDispatch();
  const {textLogs, executionId, connectors, isTesting, isFinished, executionTime, isForcedFinished} = useAppSelector((state: RootState) => state.connectionLogReducer);
  const {
    logPanelHeight, isDetailsOpened
  } = Connection.getReduxState();
  const {isFullScreen} = Application.getReduxState();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteLogs = async (executionId: string) => {
    setIsDeleting(true);
    //await dispatch(deleteLogs({ executionId }));
    setIsDeleting(false);
    dispatch(clearSocketLog());
  };

  return (
    <React.Fragment>
        <TopStyled logPanelHeight={logPanelHeight}>
          {logPanelHeight !== 0 && <HeaderStyled id={'test_execution_process'} value={'Logs'} width={isDetailsOpened ? 'calc(100% - 300px)' : '100%'}/>}
          {logPanelHeight !== 0 && <ClearButtonStyled
              right={isDetailsOpened ? isFullScreen ? 312 : 300 : isFullScreen ? 12 : 2}
              iconSize={TextSize.Size_20}
              position={'right'}
              isDisabled={isDeleting || connectors.length === 0 || isTesting}
              isLoading={isTesting}
              icon={'delete'}
              tooltip={'Clear Logs'}
              target={`clear_log_panel`}
              hasBackground={false}
              handleClick={() => handleDeleteLogs(executionId)}
          />}
          <FullLogsButtonStyled
              right={isDetailsOpened ? isFullScreen ? 336 : 324 : isFullScreen ? 36 : 24}
              tooltip={'Fullscreen'}
              target={`log_panel_full`}
              hasBackground={false}
              handleClick={() => {
                if (logPanelHeight === LogPanelHeight.Full) {
                  dispatch(setLogPanelHeight(LogPanelHeight.High))
                  dispatch(setFullScreen(false));
                } else {
                  dispatch(setLogPanelHeight(LogPanelHeight.Full))
                  dispatch(setFullScreen(true));
                }
              }}
              icon={`arrow_drop_${logPanelHeight === LogPanelHeight.Full ? 'down' : 'up'}`}
              size={TextSize.Size_20}
          />
        </TopStyled>
      <LogPanelStyled id={'connection_current_logs'} isFullScreen={isFullScreen} noLogs={textLogs.length === 0} isDetailsOpened={isDetailsOpened} logPanelHeight={logPanelHeight}>
          {connectors.length === 0 && !isTesting ?
              <EmptyLogsStyled>{"There is no any log."}</EmptyLogsStyled>
              :
              connectors.map((connector) => (
                <ConnectorPanel
                  key={connector.flowId}
                  connector={connector}
                  executionId={executionId}
                  theme={theme}
                />
            ))}
          {isFinished && <FinishedLogsStyled>{`TEST FINISHED in ${formatDuration(executionTime)}`}</FinishedLogsStyled>}
          {isForcedFinished && <ForcedFinishedLogsStyled>{`TEST STOPPED`}</ForcedFinishedLogsStyled>}
      </LogPanelStyled>
    </React.Fragment>
  );
};

export default LogsPanel;

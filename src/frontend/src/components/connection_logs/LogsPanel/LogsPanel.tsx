import { TextSize } from "@app_component/base/text/interfaces";
import { Application } from "@application/classes/Application";
import { RootState, useAppDispatch, useAppSelector } from "@application/utils/store";
import {
    ClearButtonStyled,
    CollectionDataErrorStyled,
    EmptyLogsStyled,
    FinishedLogsStyled,
    ForcedFinishedLogsStyled,
    FullLogsButtonStyled,
    HeaderStyled,
    LogPanelStyled,
    MinimizeLogsButtonStyled,
    TopStyled
} from "@change_component/form_elements/form_connection/form_svg/layouts/logs/styles";
import { Connection } from "@root/classes/Connection";
import {ColorTheme, ITheme} from '@style/Theme';
import React, {useEffect, useState} from 'react';
import {clearSocketLog, clearTextLog} from "@root/redux_toolkit/slices/ConnectionLogSlice";
import ConnectorPanel from "@app_component/connection_logs/ConnectorPanel/ConnectorPanel";
import {LogPanelHeight, setLogPanelHeight} from "@root/redux_toolkit/slices/ConnectionSlice";
import {setFullScreen} from "@application/redux_toolkit/slices/ApplicationSlice";
import {DefaultInputTextSize} from "@entity/application/utils/constants";
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
  const {collectionDataError, textLogs, executionId, connectors, isTesting, isFinished, executionTime, isForcedFinished, currentLogError} = useAppSelector((state: RootState) => state.connectionLogReducer);
  const {
    logPanelHeight, isDetailsOpened
  } = Connection.getReduxState();
  const {isFullScreen, isMenuExpanded} = Application.getReduxState();
  const [overflowY, setOverflowY] = useState<'hidden' | 'auto'>('hidden');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteLogs = async (executionId: string) => {
    setIsDeleting(true);
    //await dispatch(deleteLogs({ executionId }));
    setIsDeleting(false);
    dispatch(clearSocketLog());
  };
    useEffect(() => {
        if (logPanelHeight !== LogPanelHeight.Low) {
            setTimeout(() => {
                setOverflowY('auto')
            }, 500)
        } else {
            setOverflowY('hidden')
        }
    }, [logPanelHeight])
  return (
    <React.Fragment>
      <LogPanelStyled
          id={'connection_current_logs'}
          isFullScreen={isFullScreen}
          noLogs={textLogs.length === 0}
          isDetailsOpened={isDetailsOpened}
          logPanelHeight={logPanelHeight}
          isMenuExpanded={isMenuExpanded}
          style={{
              overflowY,
          }}
      >
          <TopStyled
              logPanelHeight={logPanelHeight}
              isFullScreen={isFullScreen}
              isDetailsOpened={isDetailsOpened}
              isMenuExpanded={isMenuExpanded}
          >
              <HeaderStyled id={'test_execution_process'} value={'Logs'} width={isDetailsOpened ? 'calc(100% - 300px)' : '100%'}/>
              <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                  {logPanelHeight !== LogPanelHeight.Full && <MinimizeLogsButtonStyled
                      right={isDetailsOpened ? isFullScreen ? 359 : 347 : isFullScreen ? 59 : 47}
                      tooltip={logPanelHeight !== LogPanelHeight.Low ? 'Hide' : 'Show'}
                      target={`log_panel_hide`}
                      hasBackground={false}
                      handleClick={() => {
                          if (logPanelHeight !== LogPanelHeight.Low) {
                              dispatch(setLogPanelHeight(LogPanelHeight.Low))
                          } else {
                              dispatch(setLogPanelHeight(LogPanelHeight.High))
                          }
                      }}
                      icon={logPanelHeight !== LogPanelHeight.Low ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}
                      size={TextSize.Size_20}
                  />}
                  <FullLogsButtonStyled
                      right={isDetailsOpened ? isFullScreen ? 336 : 324 : isFullScreen ? 36 : 24}
                      tooltip={`${logPanelHeight === LogPanelHeight.Full ? 'Minimize' : 'Fullscreen'}`}
                      target={`log_panel_full`}
                      hasBackground={false}
                      handleClick={() => {
                          if (logPanelHeight === LogPanelHeight.Full) {
                              dispatch(setLogPanelHeight(LogPanelHeight.High))
                          } else {
                              dispatch(setLogPanelHeight(LogPanelHeight.Full))
                              dispatch(setFullScreen(true));
                          }
                      }}
                      icon={`${logPanelHeight === LogPanelHeight.Full ? 'keyboard_arrow_down' : 'fullscreen'}`}
                      size={TextSize.Size_20}
                  />
                  <ClearButtonStyled
                      right={isDetailsOpened ? isFullScreen ? 312 : 300 : isFullScreen ? 12 : 2}
                      iconSize={TextSize.Size_20}
                      position={'right'}
                      isDisabled={(isDeleting || connectors.length === 0 || isTesting) && !collectionDataError}
                      isLoading={isTesting}
                      icon={'delete'}
                      tooltip={'Clear Logs'}
                      target={`clear_log_panel`}
                      hasBackground={false}
                      handleClick={() => handleDeleteLogs(executionId)}
                  />

              </div>
          </TopStyled>
          {!!collectionDataError ? <CollectionDataErrorStyled style={{fontSize: `${DefaultInputTextSize}`}}>{`There is an error: `}<strong>{collectionDataError}</strong></CollectionDataErrorStyled> :
              connectors.length === 0 && !isTesting ?
                  <EmptyLogsStyled style={{fontSize: `${DefaultInputTextSize}`}}>{"There is no any log"}</EmptyLogsStyled>
                  :
              connectors.map((connector) => (
                <ConnectorPanel
                  key={connector.flowId}
                  connector={connector}
                  executionId={executionId}
                  theme={theme}
                />
            ))}
          {isFinished && <FinishedLogsStyled value={`TEST FINISHED in ${formatDuration(executionTime)}`}/>}
          {(isForcedFinished || !!currentLogError?.log) && <ForcedFinishedLogsStyled value={`TEST STOPPED`}/>}
      </LogPanelStyled>
    </React.Fragment>
  );
};

export default LogsPanel;

import { TextSize } from "@app_component/base/text/interfaces";
import { Application } from "@application/classes/Application";
import { RootState, useAppDispatch, useAppSelector } from "@application/utils/store";
import {
  ClearButtonStyled,
  HeaderStyled, LogPanelStyled, TopStyled
} from "@change_component/form_elements/form_connection/form_svg/layouts/logs/styles";
import { Connection } from "@root/classes/Connection";
import { ITheme } from '@style/Theme';
import React, { useState } from 'react';
import {clearTextLog} from "@root/redux_toolkit/slices/ConnectionLogSlice";
import LogViewer from "@app_component/connection_logs/TextLog";
export const ShowIndexPath = false;

interface LogsPanelProps {
  theme?: ITheme;
}

const LogsPanel: React.FC<LogsPanelProps> = ({theme}) => {
  const dispatch = useAppDispatch();
  const {textLogs} = useAppSelector((state: RootState) => state.connectionLogReducer);
  const {
    logPanelHeight, isDetailsOpened
  } = Connection.getReduxState();
  const {isFullScreen} = Application.getReduxState();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteLogs = async (/*executionId: string, connectionId: string*/) => {
    /*setIsDeleting(true);
    await dispatch(deleteLogs({ executionId, connectionId }));
    setIsDeleting(false);*/
    dispatch(clearTextLog());
  };

  return (
    <React.Fragment>
        <TopStyled logPanelHeight={logPanelHeight}>
          {logPanelHeight !== 0 && <HeaderStyled id={'test_execution_process'} value={'Logs'} width={isDetailsOpened ? 'calc(100% - 300px)' : '100%'}/>}
          {logPanelHeight !== 0 && <ClearButtonStyled
              right={isDetailsOpened ? isFullScreen ? 312 : 300 : isFullScreen ? 12 : 2}
              iconSize={TextSize.Size_20}
              position={'right'}
              //isDisabled={isDeleting || connectionLog.connectors.length === 0}
              isDisabled={isDeleting || textLogs.length === 0}
              icon={'delete'}
              tooltip={'Clear Logs'}
              target={`clear_log_panel`}
              hasBackground={false}
              handleClick={() => handleDeleteLogs(/*executionId, connectionId*/)}
          />}
        </TopStyled>
      <LogPanelStyled id={'connection_current_logs'} isFullScreen={isFullScreen} noLogs={textLogs.length === 0} isDetailsOpened={isDetailsOpened} logPanelHeight={logPanelHeight}>
        <div style={{display: 'grid', gap: 10}}>
        {
          textLogs.map(log => {
            return (
                <React.Fragment>
                  {/*<div>{`${log.datetime} ${log.type} ${log.message}`}</div>*/}
                  <LogViewer logText={`${log.datetime} ${log.type} ${log.message}`}/>
                </React.Fragment>
            )
          })
        }
        </div>
          {/*{connectionLog.connectors.map((connector) => (
            <ConnectorPanel
              key={connector.id}
              connector={connector}
              executionId={connectionLog.executionId}
              connectionId={connectionLog.connectionId}
              theme={theme}
            />
          ))}*/}
      </LogPanelStyled>
    </React.Fragment>
  );
};

export default LogsPanel;

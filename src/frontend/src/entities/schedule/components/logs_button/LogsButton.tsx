import React, {useEffect, useState} from 'react';
import ReactJsonView from 'react-json-view';
import Dialog from "@app_component/base/dialog/Dialog";
import {TextSize} from "@app_component/base/text/interfaces";
import {TooltipButton} from "@app_component/base/tooltip_button/TooltipButton";
import {ISchedule} from "@entity/schedule/interfaces/ISchedule";
import {
    UrlStyled, HeaderStyled, ResponseStyled, RequestStyled, LogsButtonStyled,
    PayloadStyled, ResponseContent, RequestContent, Label, MaskedText, HeaderItemStyled, Clicker,
} from "./styles";
import {RuleBaseModel} from "@root/requests/models/Rule";
import {RootState, useAppDispatch, useAppSelector} from "@application/utils/store";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {generateLogs} from "@root/redux_toolkit/action_creators/ConnectionCreators";
import Button from "@basic_components/buttons/Button";
import Rule from "@root/classes/Rule";
import FormSelect from "@change_component/form_elements/FormSelect";
import InputSelect from "@app_component/base/input/select/InputSelect";
import {DefaultTextSize} from "@entity/application/utils/constants";
import Tour from "@app_component/base/tour/Tour";
import {ColorTheme} from "@style/Theme";
import {ScheduleSupportLogsSteps} from "@entity/schedule/utils/tourSteps";

const LogsButton = ({schedule}: {schedule: ISchedule}) => {
    const dispatch = useAppDispatch();
    const [startTour, toggleTour] = useState<boolean>(false);
    const {generatingLogs} = useAppSelector((state: RootState) => state.connectionReducer);
    const [startAction, toggleAction] = useState<boolean>(false);
    const [isToggled, toggle] = useState<boolean>(false);
    const [level, setLevel] = useState<any>( {label: 'Light', value: 'light'});
    const levelOptions = [
        {label: 'Custom', value: 'custom'},
        {label: 'Light', value: 'light'},
        {label: 'Medium', value: 'medium'},
        {label: 'Strict', value: 'strict'}
    ]
    const [maskedUrl, toggleUrl] = useState<boolean>(false);
    const [maskedHeader, toggleHeader] = useState<boolean>(false);
    const [maskedRequest, toggleRequest] = useState<boolean>(false);
    const [maskedResponse, toggleResponse] = useState<boolean>(false);
    const url = maskedUrl ? '*******************' : 'protocol://host:server?key1=value1&key2=value2';
    const startCollectingLogs = () => {
        let rules: RuleBaseModel[] = Rule.getRulesForForm({
            isUrl: maskedUrl,
            isHeader: maskedHeader,
            isRequest: maskedRequest,
            isResponse: maskedResponse,
        })
        toggleAction(true);
        dispatch(generateLogs({
            rules,
            connectionId: schedule.connection.connectionId,
            schedulerId: schedule.id,
        }))
    }
    useEffect(() => {
        switch(level?.value) {
            case 'light':
                toggleUrl(true);
                toggleHeader(false);
                toggleRequest(false);
                toggleResponse(false);
                break;
            case 'medium':
                toggleUrl(true);
                toggleHeader(true);
                toggleRequest(false);
                toggleResponse(false);
                break;
            case 'strict':
                toggleUrl(true);
                toggleHeader(true);
                toggleRequest(true);
                toggleResponse(false);
                break;
        }
    }, [level])
    useEffect(() => {
        if (maskedUrl && !maskedHeader && !maskedRequest && !maskedResponse) {
            if (level?.value !== 'light') {
                setLevel( {label: 'Light', value: 'light'});
            }
        } else if (maskedUrl && maskedHeader && !maskedRequest && !maskedResponse) {
            if (level?.value !== 'medium') {
                setLevel( {label: 'Medium', value: 'medium'});
            }
        } else if (maskedUrl && maskedHeader && maskedRequest && !maskedResponse) {
            if (level?.value !== 'strict') {
                setLevel( {label: 'Strict', value: 'strict'});
            }
        } else {
            if (level?.value !== 'custom') {
                setLevel( {label: 'Custom', value: 'custom'});
            }
        }
    }, [maskedUrl, maskedHeader, maskedRequest, maskedResponse])
    useEffect(() => {
        if (startAction && generatingLogs === API_REQUEST_STATE.FINISH || generatingLogs === API_REQUEST_STATE.ERROR){
            toggleAction(false);
            toggle(false);
        }
    }, [generatingLogs]);
    return (
        <React.Fragment>
            <TooltipButton
                target={`get_logs_entity_${schedule.id.toString()}`}
                position={'top'}
                tooltip={'Logs'}
                hasBackground={false}
                handleClick={() => toggle(true)}
                icon={'ballot'}
            />
            <Dialog id={'schedule-support-log-header'}
                actions={[{label: 'Create Support-Logs', isLoading: startAction && generatingLogs === API_REQUEST_STATE.START, onClick: startCollectingLogs, id: 'get_logs_button'}, {label: 'Cancel', onClick: () => toggle(false), id: 'cancel_button'}]}
                active={isToggled}
                toggle={() => toggle(!isToggled)}
                title={<div style={{display: 'inline', position: 'relative'}}>
                    <span>Support Logs</span>
                    <Tour steps={ScheduleSupportLogsSteps} toggle={toggleTour} show={startTour}/>
                    <Button
                        position={'absolute'}
                        right={-20}
                        top={'-5px'}
                        hasBackground={false}
                        icon={'info'}
                        color={ColorTheme.Blue}
                        handleClick={() => toggleTour(true)}
                    />
                </div>}
                styles={{modal: {minWidth: '650px'}, body: {minHeight: '400px'}}}
            >
                <LogsButtonStyled>
                    <InputSelect
                        label={'Level of masking'}
                        icon={'filter_list'}
                        value={level}
                        onChange={(value) => setLevel(value)}
                        options={levelOptions}/>
                    <Label>
                        {"URL"}
                        <Button handleClick={() => toggleUrl(!maskedUrl)} hasBackground={false} icon={maskedUrl ? 'visibility_off' : 'visibility'} />
                    </Label>
                    <UrlStyled
                        onClick={() => toggleUrl(!maskedUrl)}>
                        <MaskedText masked={maskedUrl}>
                            {url}
                        </MaskedText>
                    </UrlStyled>
                    <Label>
                        {"Headers"}
                        <Button handleClick={() => toggleHeader(!maskedHeader)} hasBackground={false} icon={maskedHeader ? 'visibility_off' : 'visibility'} />
                    </Label>
                    <HeaderStyled
                        className={maskedHeader ? 'masked' : ''}
                        onClick={() => toggleHeader(!maskedHeader)}
                    >
                        <table>
                            <tr>
                                <td>
                                    <MaskedText masked={maskedHeader}>
                                        {"Authorization:"}
                                    </MaskedText>
                                </td>
                                <td>
                                    <MaskedText masked={maskedHeader}>
                                        {`${maskedHeader ? '***********' : 'Bearer fj28h9kskfna23mmf92' } `}
                                    </MaskedText>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <MaskedText masked={maskedHeader}>
                                        {"Content-Type:"}
                                    </MaskedText>
                                </td>
                                <td>
                                    <MaskedText masked={maskedHeader}>
                                        {`${maskedHeader ? '***********' : 'application/json'}`}
                                    </MaskedText>
                                </td>
                            </tr>
                        </table>
                        <div>
                            <MaskedText masked={maskedHeader}>
                                {"..."}
                            </MaskedText>
                        </div>
                    </HeaderStyled>
                    <PayloadStyled>
                        <RequestStyled
                            className={maskedRequest ? 'masked' : ''}>
                            <Label>
                                {"Request"}
                                <Button handleClick={() => toggleRequest(!maskedRequest)} hasBackground={false} icon={maskedRequest ? 'visibility_off' : 'visibility'} />
                            </Label>
                            <Clicker onClick={() => toggleRequest(!maskedRequest)}/>
                            <RequestContent>
                                {maskedRequest ?
                                    <MaskedText masked={maskedRequest}>
                                        {"*******************"}
                                    </MaskedText>
                                    :
                                    <ReactJsonView enableClipboard={false} style={{fontSize: `${DefaultTextSize}px`}} iconStyle={'circle'} collapsed={false} src={{body: {_id: '31'}}}/>
                                }
                            </RequestContent>
                        </RequestStyled>
                        <ResponseStyled
                            className={maskedResponse ? 'masked' : ''}>
                            <Label>
                                {"Response"}
                                <Button handleClick={() => toggleResponse(!maskedResponse)} hasBackground={false} icon={maskedResponse ? 'visibility_off' : 'visibility'} />
                            </Label>
                            <Clicker onClick={() => toggleResponse(!maskedResponse)}/>
                            <ResponseContent>
                                {maskedResponse ?
                                    <MaskedText masked={maskedResponse}>
                                        {"*******************"}
                                    </MaskedText>
                                    :
                                    <ReactJsonView
                                        enableClipboard={false}
                                        iconStyle={'circle'}
                                        collapsed={false}
                                        style={{fontSize: `${DefaultTextSize}px`}}
                                        src={{body: {transactionId: '31', type: 3}}}
                                    />
                                }
                            </ResponseContent>
                        </ResponseStyled>
                    </PayloadStyled>
                </LogsButtonStyled>
            </Dialog>
        </React.Fragment>
    )
}

export default LogsButton;

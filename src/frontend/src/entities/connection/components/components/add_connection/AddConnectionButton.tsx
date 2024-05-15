import React, {useEffect, useState} from 'react';
import {
    Dropdown,
    DropdownMenu,
    DropdownItem,
} from 'reactstrap';
import PropTypes from 'prop-types';
import {DropdownMenuProps} from "reactstrap/es/DropdownMenu";
import {useNavigate} from "react-router";
import Dialog from "@app_component/base/dialog/Dialog";
import Loading from "@app_component/base/loading/Loading";
import {withTheme} from "styled-components";
import {DropdownItemStyled, DropdownToggleStyled} from "./style";
import {API_REQUEST_STATE, TRIPLET_STATE} from "@application/interfaces/IApplication";
import {ColorTheme} from "@style/Theme";
import InputText from "@app_component/base/input/text/InputText";
import InputSelect from "@app_component/base/input/select/InputSelect";
import {RootState, useAppDispatch, useAppSelector} from "@application/utils/store";
import {Connection} from "@root/classes/Connection";
import {Connector} from "@entity/connector/classes/Connector";
import {setFocusById} from "@application/utils/utils";
import {addConnection, checkConnectionTitle} from "@root/redux_toolkit/action_creators/ConnectionCreators";
import {getAllConnectors} from "@entity/connector/redux_toolkit/action_creators/ConnectorCreators";
import {getTemplatesByConnectors} from "@entity/template/redux_toolkit/action_creators/TemplateCreators";

function AddConnectionButton({ theme, direction, ...args }: DropdownMenuProps & {theme?: any}) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dispatch = useAppDispatch();
    let navigate = useNavigate();
    const [startAdding, setStartAdding] = useState<boolean>(false);
    const {addingConnection, currentConnection, checkingConnectionTitle, isCurrentConnectionHasUniqueTitle} = Connection.getReduxState();
    const {templates, gettingTemplates} = useAppSelector((state: RootState) => state.templateReducer);
    const {connectors, gettingConnectors} = Connector.getReduxState();
    const [isOpened, setIsOpened] = useState<boolean>(false);
    const [title, setTitle] = useState<string>('');
    const [fromConnector, setFromConnector] = useState(null);
    const [toConnector, setToConnector] = useState(null);
    const [template, setTemplate] = useState(null);
    const [validateMessageTitle, setValidateMessageTitle] = useState('');
    const [validateMessageFromConnector, setValidateMessageFromConnector] = useState('');
    const [validateMessageToConnector, setValidateMessageToConnector] = useState('');
    const [validateMessageTemplate, setValidateMessageTemplate] = useState('');
    const fromConnectorOptions = connectors.map((connector: any) => {return {label: connector.title, value: connector.connectorId}});
    const toConnectorOptions = connectors.map((connector: any) => {return {label: connector.title, value: connector.connectorId}});
    const templateOptions = templates.map(t => {
        return {
            value: t.templateId,
            label: t.name,
            content: t.connection,
        };
    })
    const isLoading = gettingConnectors !== API_REQUEST_STATE.FINISH;
    const onChangeTitle = (title: string) => {
        setTitle(title);
        setValidateMessageTitle('');
    }
    const onChangeFromConnector = (fromConnector: any) => {
        setFromConnector(fromConnector);
        setValidateMessageFromConnector('');
    }
    const onChangeToConnector = (toConnector: any) => {
        setToConnector(toConnector);
        setValidateMessageToConnector('');
    }
    const onChangeTemplate = (template: any) => {
        setTemplate(template);
        setValidateMessageTemplate('');
    }
    const toggleForm = () => {
        if(isOpened){
            setTitle('');
            setFromConnector(null);
            setToConnector(null);
            setTemplate(null);
        }
        setIsOpened(!isOpened);
    }
    const validateFields = () => {
        let validateMessageTitle = '';
        let validateMessageFromConnector = '';
        let validateMessageToConnector = '';
        let validateMessageTemplate = '';
        if(title === ''){
            validateMessageTitle = `Title is a required field`;
            setFocusById('input_quick_title');
        }
        if(!fromConnector){
            validateMessageFromConnector = `From Connector is a required field`;
            if(validateMessageTitle === '') setFocusById('input_quick_from_connector');
        }
        if(!toConnector){
            validateMessageToConnector = `To Connector is a required field`;
            if(validateMessageTitle === '' && validateMessageFromConnector === '') setFocusById('input_quick_to_connector');
        }
        if(!template){
            validateMessageTemplate = `Template is a required field`;
            if(validateMessageTitle === '' && validateMessageFromConnector === '' && validateMessageToConnector === '') setFocusById('input_quick_template');
        }
        setValidateMessageTitle(validateMessageTitle);
        setValidateMessageFromConnector(validateMessageFromConnector);
        setValidateMessageToConnector(validateMessageToConnector);
        setValidateMessageTemplate(validateMessageTemplate);
        if(title !== '' && fromConnector && toConnector && template){
            setStartAdding(true);
            // @ts-ignore
            const tmpConnection = new Connection({title, dispatch});
            dispatch(checkConnectionTitle(tmpConnection));
        }
        return false;
    }
    const createConnection = () => {
        if(startAdding) {
            dispatch(addConnection({
                ...template.content,
                title: title,
            }));
        }
    }
    useEffect(() => {
        if(addingConnection === API_REQUEST_STATE.FINISH && startAdding) {
            toggleForm();
            setStartAdding(false);
        }
    }, [addingConnection])
    useEffect(() => {
        if(isOpened) {
            dispatch(getAllConnectors());
        }
    },[isOpened ])

    useEffect(() => {
        if(fromConnector && toConnector) {
            dispatch(getTemplatesByConnectors({from: fromConnector.value, to: toConnector.value}))
        }
    }, [fromConnector, toConnector])

    useEffect(() => {
        if(isCurrentConnectionHasUniqueTitle === TRIPLET_STATE.TRUE && startAdding){
            createConnection();
        }
        if(isCurrentConnectionHasUniqueTitle === TRIPLET_STATE.FALSE){
            setValidateMessageTitle('Title should be unique');
            setFocusById('duplicate_title');
            setStartAdding(false);
        }
    }, [checkingConnectionTitle])

    const toggle = () => setDropdownOpen((prevState) => !prevState);

    const openEditor = () => {
        navigate('add', { replace: false });
    }

    return (
        <>
            <Dropdown isOpen={dropdownOpen} toggle={toggle} direction={direction}>
                <DropdownToggleStyled caret>{"Add Connection"}</DropdownToggleStyled>
                <DropdownMenu {...args}>
                    <DropdownItemStyled onClick={toggleForm}>{"by template"}</DropdownItemStyled>
                    <DropdownItemStyled onClick={openEditor}>{"using editor"}</DropdownItemStyled>
                </DropdownMenu>
            </Dropdown>
            <Dialog
                actions={[
                    {id: 'quick_add_ok', label: 'Ok', onClick: validateFields, isLoading: addingConnection === API_REQUEST_STATE.START || checkingConnectionTitle === API_REQUEST_STATE.START},
                    {id: 'quick_add_cancel', label: 'Cancel', onClick: toggleForm}]}
                title={'Add Connection by Template'} active={isOpened} toggle={toggleForm}>
                {isLoading ? <Loading color={ColorTheme.Blue}/> :
                    <React.Fragment>
                        <InputText
                            id={`input_quick_title`}
                            onChange={(e) => onChangeTitle(e.target.value)}
                            value={title}
                            error={validateMessageTitle}
                            isLoading={checkingConnectionTitle === API_REQUEST_STATE.START}
                            autoFocus
                            required
                            icon={'title'}
                            maxLength={256}
                            label={'Title'}
                        />
                        <InputSelect
                            id={`input_quick_from_connector`}
                            error={validateMessageFromConnector}
                            onChange={(option: any) => onChangeFromConnector(option)}
                            value={fromConnector}
                            required
                            icon={'device_hub'}
                            label={'From Connector'}
                            options={fromConnectorOptions}
                        />
                        <InputSelect
                            id={`input_quick_to_connector`}
                            error={validateMessageToConnector}
                            onChange={(option: any) => onChangeToConnector(option)}
                            value={toConnector}
                            required
                            icon={'device_hub'}
                            label={'To Connector'}
                            options={toConnectorOptions}
                        />
                        <InputSelect
                            isLoading={gettingTemplates === API_REQUEST_STATE.START}
                            id={`input_quick_template`}
                            error={validateMessageTemplate}
                            onChange={(option: any) => onChangeTemplate(option)}
                            value={template}
                            required
                            icon={'device_hub'}
                            label={'Template'}
                            options={templateOptions}
                        />
                    </React.Fragment>
                }
            </Dialog>
        </>
    );
}

AddConnectionButton.propTypes = {
    direction: PropTypes.string,
};

export default withTheme(AddConnectionButton);

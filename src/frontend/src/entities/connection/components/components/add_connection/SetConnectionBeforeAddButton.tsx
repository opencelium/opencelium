import React, {useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import {DropdownMenuProps} from "reactstrap/es/DropdownMenu";
import {useNavigate} from "react-router";
import Dialog from "@app_component/base/dialog/Dialog";
import Loading from "@app_component/base/loading/Loading";
import {withTheme} from "styled-components";
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
import {Category} from "@entity/category/classes/Category";
import {getAllCategories} from "@entity/category/redux_toolkit/action_creators/CategoryCreators";
import {clearTemplates} from "@entity/template/redux_toolkit/slices/TemplateSlice";
import DropdownActionButton from '@app_component/dropdown_action_button/DropdownActionButton';
import description from "@change_component/form_elements/form_connection/form_svg/details/description/Description";
import {CONNECTOR_FROM, CONNECTOR_TO} from "@classes/content/connection/CConnectorItem";
import CConnection from "@classes/content/connection/CConnection";

function SetConnectionBeforeAdd({ theme,  connection, onSet, isOpenedInit}: {onSet: (connection: CConnection) => void, connection?: CConnection,theme?: any, isOpenedInit: boolean}) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dispatch = useAppDispatch();
    let navigate = useNavigate();
    const [startAdding, setStartAdding] = useState<boolean>(false);
    const {addingConnection, currentConnection, checkingConnectionTitle, isCurrentConnectionHasUniqueTitle} = Connection.getReduxState();
    const {templates, gettingTemplates} = useAppSelector((state: RootState) => state.templateReducer);
    const {connectors, gettingConnectors} = Connector.getReduxState();
    const {categories, gettingCategories} = Category.getReduxState();
    const [isOpened, setIsOpened] = useState<boolean>(isOpenedInit);
    const [title, setTitle] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [fromConnector, setFromConnector] = useState(null);
    const [toConnector, setToConnector] = useState(null);
    const [template, setTemplate] = useState(null);
    const [validateMessageTitle, setValidateMessageTitle] = useState('');
    const [validateMessageFromConnector, setValidateMessageFromConnector] = useState('');
    const [validateMessageToConnector, setValidateMessageToConnector] = useState('');
    const [validateMessageTemplate, setValidateMessageTemplate] = useState('');
    const [category, setCategory] = useState(null);
    const [categoryOptions, setCategoryOptions] = useState([]);
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
        dispatch(clearTemplates());
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
        setValidateMessageTitle(validateMessageTitle);
        setValidateMessageFromConnector(validateMessageFromConnector);
        setValidateMessageToConnector(validateMessageToConnector);
        setValidateMessageTemplate(validateMessageTemplate);
        if(title !== '' && fromConnector && toConnector){
            setStartAdding(true);
            // @ts-ignore
            const tmpConnection = new Connection({title, dispatch});
            dispatch(checkConnectionTitle(tmpConnection));
        }
        return false;
    }
    const createConnection = () => {
        if(startAdding) {
            if (template?.content) {
                let templateContent = CConnection.createConnection({...template.content});
                //fromConnector
                let connector = connectors.find(c => c.connectorId === templateContent.fromConnector.id);
                templateContent.fromConnector.invoker = connector.invoker as any;
                templateContent.fromConnector.setCurrentItem(templateContent.fromConnector.methods[templateContent.fromConnector.methods.length - 1]);
                templateContent.fromConnector.setConnectorType(CONNECTOR_FROM);
                templateContent.fromConnector.title = connection.fromConnector.title;
                connection.fromConnector = templateContent.fromConnector;
                connection.fromConnector.setHeadersForMethods();
                //toConnector
                connector = connectors.find(c => c.connectorId === templateContent.toConnector.id);
                templateContent.toConnector.invoker = connector.invoker as any;
                templateContent.toConnector.setConnectorType(CONNECTOR_TO);
                templateContent.toConnector.title = connection.toConnector.title;
                templateContent.toConnector.setCurrentItem(templateContent.toConnector.methods[templateContent.toConnector.methods.length - 1]);
                connection.toConnector = templateContent.toConnector;
                connection.toConnector.setHeadersForMethods();
                //fieldBinding
                connection.fieldBinding = templateContent.fieldBinding;
                connection.ui = templateContent.ui;
                connection.template.templateId = template.value;
                connection.template.label = template.label;
            } else {
                let fromConnectorSource = connectors ? connectors.find(c => c.connectorId === fromConnector.value) : null;
                let toConnectorSource = connectors ? connectors.find(c => c.connectorId === toConnector.value) : null;
                if (!fromConnectorSource || !toConnectorSource) {
                    return;
                }
                connection.fromConnector.id = fromConnectorSource.connectorId;
                connection.fromConnector.title = fromConnectorSource.title;
                connection.fromConnector.invoker = fromConnectorSource.invoker as any;
                connection.fromConnector.setConnectorType(CONNECTOR_FROM);
                connection.toConnector.id = toConnectorSource.connectorId;
                connection.toConnector.title = toConnectorSource.title;
                connection.toConnector.invoker = toConnectorSource.invoker as any;
                connection.toConnector.setConnectorType(CONNECTOR_TO);
            }
            connection.title = title;
            connection.description = description;
            if (category) {
                connection.categoryId = category.value;
            }
            onSet(connection);
            toggleForm();
        }
    }
    useEffect(() => {
        if(addingConnection === API_REQUEST_STATE.FINISH && startAdding) {
            setStartAdding(false);
        }
    }, [addingConnection])
    useEffect(() => {
        if (gettingCategories === API_REQUEST_STATE.FINISH) {
            setCategoryOptions(Category.getOptionsForCategorySelect(categories));
        }
    }, [gettingCategories]);
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

    useEffect(() => {
        if (dropdownOpen) {
            dispatch(getAllCategories());
        }
    }, [dropdownOpen]);


    return (
        <Dialog
            autoFocus={false}
            actions={[
                {id: 'set_con_ok', label: 'Set', onClick: validateFields, isLoading: addingConnection === API_REQUEST_STATE.START || checkingConnectionTitle === API_REQUEST_STATE.START},
                {id: 'set_con_cancel', label: 'Cancel', onClick: () => {
                    navigate('/connections', { replace: false });
                }},
            ]}
            active={isOpened} toggle={() => {}}>
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
                        icon={'device_hub'}
                        label={'Template'}
                        options={templateOptions}
                    />
                    <InputSelect
                        id={'input_quick_category'}
                        value={category}
                        onChange={(a) => setCategory(a)}
                        options={categoryOptions}
                        placeholder={'Choose category'}
                        icon={'category'}
                        label={'Category'}
                        categoryList={true}
                        isLoading={gettingCategories === API_REQUEST_STATE.START}
                    />
                </React.Fragment>
            }
        </Dialog>
    );
}

SetConnectionBeforeAdd.propTypes = {
    direction: PropTypes.string,
};

export default withTheme(SetConnectionBeforeAdd);

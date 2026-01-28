/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {FC, useEffect, useMemo, useRef, useState} from "react";
import {useNavigate, useParams} from "react-router";
import {API_REQUEST_STATE, TRIPLET_STATE} from "@application/interfaces/IApplication";
import {IForm} from "@application/interfaces/IForm";
import {Form} from "@application/classes/Form";
import FormSection from "@app_component/form/form_section/FormSection";
import FormComponent from "@app_component/form/form/Form";
import Button from "@app_component/base/button/Button";
import {NotificationTemplate} from "../../classes/NotificationTemplate";
import {IContent, INotificationTemplate} from "../../interfaces/INotificationTemplate";
import {Content} from "../../classes/Content";
import InputSelect from "@app_component/base/input/select/InputSelect";
import {useAppDispatch} from "@application/utils/store";
import {ModelArgument} from "@entity/data_aggregator/requests/models/DataAggregator";
import Input from "@app_component/base/input/Input";
import {AggregatorNameStyled, DataAggregatorItemsStyled } from "./styles";
import {CDataAggregator} from "@entity/data_aggregator/classes/CDataAggregator";
import { getAllUnarchivedAggregators } from "@entity/data_aggregator/redux_toolkit/action_creators/DataAggregatorCreators";
import HelpDivider from '../help_divider/HelpDivider';
import {getMarker} from "@application/utils/utils";
import CAggregator from "@classes/content/connection/data_aggregator/CAggregator";
import { getAllTools } from "@entity/schedule/redux_toolkit/action_creators/ToolCreators";
import Tool from "@entity/schedule/classes/Tool";
import Validation from "@application/classes/Validation";
import DropdownActionButton from '@app_component/dropdown_action_button/DropdownActionButton';



const NotificationTemplateForm: FC<IForm> = ({isAdd, isUpdate, isView}) => {
    const {
        addingNotificationTemplate, currentNotificationTemplate, updatingNotificationTemplate,
        checkingNotificationTemplateName, isCurrentNotificationTemplateHasUniqueName, error,
        gettingNotificationTemplate,
    } = NotificationTemplate.getReduxState();
    const {gettingAllTools, tools} = Tool.getReduxState();
    const {unarchivedAggregators, gettingAllUnarchivedAggregators} = CDataAggregator.getReduxState();
    const [selectedAggregator, setSelectedAggregator] = useState(null);
    const aggregatorOptions = useMemo(() => {
        return unarchivedAggregators.map(a => {return {label: a.name, value: a.id, args: a.args};});
    }, [unarchivedAggregators]);
    const dispatch = useAppDispatch();
    const didMount = useRef(false);
    let navigate = useNavigate();
    const [shouldNavigateToSchedule, setShouldNavigateToSchedule] = useState(false);
    let urlParams = useParams();
    const bodyRef = React.useRef();
    const [markers, setMarkers] = useState([]);
    const shouldFetchNotificationTemplate = isUpdate || isView;
    const shouldFetchConnections = isAdd || isUpdate;
    const form = new Form({isView, isAdd, isUpdate});
    const formData = form.getFormData('Notification Template');
    let notificationTemplateId = 0;
    if(shouldFetchNotificationTemplate){
        notificationTemplateId = parseInt(urlParams.id);
    }

    const initialNotificationTemplate = useMemo(() => {
        if(!currentNotificationTemplate){
            return null;
        }
        if(isUpdate && gettingAllUnarchivedAggregators !== API_REQUEST_STATE.FINISH){
            return null;
        }
        return {
            ...currentNotificationTemplate,
            content: [{
                // @ts-ignore
                ...currentNotificationTemplate.content[0],
                // @ts-ignore
                subject: CDataAggregator.replaceIdsOnNames(unarchivedAggregators, currentNotificationTemplate.content[0].subject),
                // @ts-ignore
                body: CDataAggregator.replaceIdsOnNames(unarchivedAggregators, currentNotificationTemplate.content[0].body),
            }]
        };
    }, [currentNotificationTemplate, gettingAllUnarchivedAggregators]);
    // @ts-ignore
    const content = Content.createState<IContent>({_readOnly: isView}, isAdd ? null : initialNotificationTemplate?.content[0]);

    const notificationTemplate = NotificationTemplate.createState<INotificationTemplate>({id: notificationTemplateId, _readOnly: isView, content}, isAdd ? null : initialNotificationTemplate);
    useEffect(() => {
        if(shouldFetchNotificationTemplate){
            notificationTemplate.getById()
        }
        if(shouldFetchConnections){
            dispatch(getAllUnarchivedAggregators());
        }
        dispatch(getAllTools());
    },[]);
    useEffect(() => {
        if(bodyRef.current) {
            //@ts-ignore
            const newMarkers = getMarker(bodyRef.current.editor, content.body, CDataAggregator.embraceArgument(CAggregator.generateNotExistVar()));
            if (JSON.stringify(newMarkers) !== JSON.stringify(markers)) {
                setMarkers(newMarkers);
            }
        }
    }, [content.body, markers])
    useEffect(() => {
        if (didMount.current) {
            const isFinish =
                (isAdd && addingNotificationTemplate === API_REQUEST_STATE.FINISH) ||
                (isUpdate &&
                    updatingNotificationTemplate === API_REQUEST_STATE.FINISH);

            if (error === null && isFinish) {
                if (isAdd && shouldNavigateToSchedule) {
                    navigate('/schedules/add', { replace: false });
                } else {
                    navigate('/notification_templates', { replace: false });
                }
                setShouldNavigateToSchedule(false);
            }
        } else {
            didMount.current = true;
        }
    }, [ addingNotificationTemplate, updatingNotificationTemplate, error, isAdd, isUpdate, shouldNavigateToSchedule ]);
    const NameInput = notificationTemplate.getText({
        propertyName: "name", props: {maxLength: Validation.TextLength.Short, autoFocus: !isView, icon: 'title', label: 'Name', required: true, isLoading: checkingNotificationTemplateName === API_REQUEST_STATE.START, error: isCurrentNotificationTemplateHasUniqueName === TRIPLET_STATE.FALSE ? 'Must be unique' : ''}
    })
    const Type = notificationTemplate.getSelect({propertyName: 'typeSelect', props: {
            icon: 'mail',
            label: 'Type',
            options: Tool.getToolsOptionsForSelect(tools),
            required: true,
            isLoading: gettingAllTools === API_REQUEST_STATE.START
        }})
    const SubjectInput = notificationTemplate.content.getText({
        propertyName: "subject", props: {maxLength: Validation.TextLength.Short, icon: 'subject', label: 'Subject', required: true}
    })
    const BodyInput = notificationTemplate.content.getTextarea({
        propertyName: "body", props: {icon: 'feed', label: 'Body', required: true, height: `calc(100% - 67px)`, style: {height: 'calc(100% - 37px)'}}
    })
    const ConnectionForm =
        <InputSelect
            id={`input_connections`}
            onChange={(option: any) => setSelectedAggregator(option)}
            value={selectedAggregator}
            icon={'subtitles'}
            label={'Data Aggregator'}
            options={aggregatorOptions}
            isLoading={gettingAllUnarchivedAggregators === API_REQUEST_STATE.START}
        />;
    const DataAggregatorItems = selectedAggregator ? (
        <Input value={selectedAggregator.value} label={'Arguments'} icon={'abc'} marginBottom={'20px'} display={'grid'}>
            <DataAggregatorItemsStyled>{
                selectedAggregator.args.length > 0 ? selectedAggregator.args.map((argument: ModelArgument) => {
                    return (
                        <AggregatorNameStyled
                            key={argument.name}
                            onClick={() => {
                                //@ts-ignore
                                content.updateBody(content, `${content.body} ${CDataAggregator.embraceArgument(`${selectedAggregator.label}.${argument.name}`)}`)
                            }}
                        >
                            {argument.name}
                        </AggregatorNameStyled>
                    );
                }) : <span>{"There are no arguments."}</span>
            }</DataAggregatorItemsStyled>
        </Input>
    ) : null;
    let actions = [
        <Button
            key={'list_button'}
            label={formData.listButton.label}
            icon={formData.listButton.icon}
            href={'/notification_templates'}
            autoFocus={isView}
        />,
    ];

    if (isAdd) {
        const handleAddAndClose = () => {
            setShouldNavigateToSchedule(false);
            notificationTemplate.add(unarchivedAggregators);
        };

        const handleAddAndGoToAddSchedule = () => {
            setShouldNavigateToSchedule(true);
            notificationTemplate.add(unarchivedAggregators);
        };

        const isAnyLoading =
            checkingNotificationTemplateName === API_REQUEST_STATE.START ||
            addingNotificationTemplate === API_REQUEST_STATE.START;

        actions.unshift(
            <DropdownActionButton
                key={'add_notification_template_dropdown'}
                label={formData.actionButton.label}
                direction={'down'}
                disabled={false}
                isLoading={isAnyLoading}
                items={[
                    {
                        id: 'add_close',
                        label: 'Add & Close',
                        onClick: handleAddAndClose,
                        isLoading:
                            addingNotificationTemplate === API_REQUEST_STATE.START &&
                            !shouldNavigateToSchedule,
                    },
                    {
                        id: 'add_go_to_add_schedule',
                        label: 'Add & Go to Add Schedule',
                        onClick: handleAddAndGoToAddSchedule,
                        isLoading:
                            addingNotificationTemplate === API_REQUEST_STATE.START &&
                            shouldNavigateToSchedule,
                    },
                ]}
            />,
        );
    }

    if (isUpdate) {
        const handleUpdateAndClose = () => {
            notificationTemplate.update(unarchivedAggregators);
        };

        actions.unshift(
            <Button
                key={'action_button'}
                label={`${formData.actionButton.label} & Close`}
                icon={formData.actionButton.icon}
                handleClick={handleUpdateAndClose}
                isLoading={
                    checkingNotificationTemplateName === API_REQUEST_STATE.START ||
                    updatingNotificationTemplate === API_REQUEST_STATE.START
                }
            />,
        );
    }

    const data = {
        title: [{name: 'Admin Panel', link: '/admin_cards'}, {name: 'Notification Templates', link: '/notification_templates'}, {name: formData.formTitle}],
        actions,
        formSections: [
            <FormSection label={{value: 'General Data'}}>
                {NameInput}
                {Type}
                <HelpDivider/>
                {ConnectionForm}
                {DataAggregatorItems}
            </FormSection>,
            <FormSection label={{value: 'Template Content'}} inputsStyle={{height: '100%'}}>
                {SubjectInput}
                {notificationTemplate.content.getBoby({ref: bodyRef, markers})}
            </FormSection>
        ]
    }
    return <FormComponent {...data} isLoading={shouldFetchNotificationTemplate && gettingNotificationTemplate === API_REQUEST_STATE.START}/>;
}

export default NotificationTemplateForm

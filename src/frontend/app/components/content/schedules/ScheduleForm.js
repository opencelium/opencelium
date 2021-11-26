import {setFocusById} from "@utils/app";
import {API_REQUEST_STATE} from "@utils/constants/app";
import {INPUTS} from "@utils/constants/inputs";
import {SCHEDULE_TOURS} from "@utils/constants/tours";
import React from "react";
import Form from "@change_component/Form";
import {SchedulePermissions} from "@utils/constants/permissions";
import OCTour from "@basic_components/OCTour";

/**
 * common component to add and update Schedule
 */
export function ScheduleForm(type) {
    return function (Component) {
        return class extends Component {
            constructor(props) {
                super(props);

                this.schedulePrefixUrl = '/schedules';
                this.translationKey = type.toUpperCase();
                this.isUpdate = type === 'update';
                this.actionName = this.isUpdate ? `updatingSchedule` : `addingSchedule`
                this.state = {
                    validationMessages: {
                        title: '',
                        connection: '',
                        cronExp: '',
                    },
                    entity: null,
                };
            }

            componentDidMount(){
                setFocusById('input_title');
            }

            /**
             * to clear validation message by name
             */
            clearValidationMessage(name){
                const {setValidationMessage} = this.props;
                setValidationMessage(this, name, '');
            }

            /**
             * to redirect app after action
             */
            redirect(){
                const {router, params} = this.props;

                router.push(this.schedulePrefixUrl);/*
                if(params && params.id) {
                    router.push(`${this.schedulePrefixUrl}/${params.id}/view`);
                } else{
                    router.push(this.schedulePrefixUrl);
                }*/
            }

            /**
             * to map connections for select
             */
            mapConnections(){
                const {connections, t} = this.props;
                let result = {connections: [], descriptions: []};
                if(connections.length > 0) {
                    result.connections.push({label: t(`${this.translationKey}.FORM.CONNECTION_PLACEHOLDER`), value: 0});
                    result.descriptions.push(t(`${this.translationKey}.FORM.DESCRIPTION_DEFAULT`));
                    connections.map(connection => {
                        result.connections.push({label: connection.title, value: connection.connectionId});
                        result.descriptions[connection.connectionId] = connection.description;
                    });
                }
                return result;
            }

            /**
             * to validate title if empty
             */
            validateTitle(entity){
                const {t} = this.props;
                if(entity.title.trim() === ''){
                    return {value: false, message: t(`${this.translationKey}.VALIDATION_MESSAGES.TITLE_REQUIRED`)};
                }
                return {value: true, message: ''};
            }

            /**
             * to validate Connection if was selected
             */
            validateConnection(entity){
                const {t} = this.props;
                if(entity.connection === 0){
                    return {value: false, message: t(`${this.translationKey}.VALIDATION_MESSAGES.CONNECTION_REQUIRED`)};
                }
                return {value: true, message: ''};
            }

            /**
             * to validate cron expression if was selected
             */
            validateCronExp(entity){
                const {t} = this.props;
                if(entity.cronExp.trim() === ''){
                    return {value: false, message: t(`${this.translationKey}.VALIDATION_MESSAGES.CRON_EXP_REQUIRED`)};
                }
                return {value: true, message: ''};
            }

            /**
             * to validate cron expression during input
             */
            validateCronExpOnChange(cronExp){
                cronExp = cronExp.toUpperCase();
                const timeParts = cronExp.split(' ');
                let timePartsLength = timeParts.length;
                if(timePartsLength > 0){
                    if(timeParts[timePartsLength - 1] === ''){
                        timePartsLength--;
                        cronExp = cronExp.substr(0, cronExp.length - 1);
                    }
                }
                const secRegExp = timePartsLength > 0 ? `^(([1-5]?[0-9])|\\,|\\-|/|\\*)*` : '';
                const minRegExp = timePartsLength > 1 ? ` (([1-5]?[0-9])|\\,|\\-|/|\\*)*` : '';
                const hourRegExp = timePartsLength > 2 ? ` (([0-1]?[0-9])|20|21|22|23|\\,|\\-|/|\\*)*` : '';
                const dayRegExp = timePartsLength > 3 ? ` (\\?|([0-2]?[0-9])|30|31|L|W|\\,|\\-|/|\\*)*` : '';
                const monthRegExp = timePartsLength > 4 ? ` (([0-9])|([A-Z])|10|11|\\,|\\-|/|\\*)*` : '';
                const dayOfWeekRegExp = timePartsLength > 5 ? ` (([0-7])|([A-Z])|L|#|\\,|\\-|/|\\?|\\*)*` : '';
                const yearRegExp = timePartsLength > 6 ? ` (([0-9]*)|\\,|\\-|/|\\*)*` : '';
                const cronRegExp = new RegExp(`${secRegExp}${minRegExp}${hourRegExp}${dayRegExp}${monthRegExp}${dayOfWeekRegExp}${yearRegExp}`+ '$');
                return cronRegExp.test(cronExp);
            }

            /**
             * to parse user after fetch
             */
            parseEntity(){
                if(this.isUpdate) {
                    return {...this.props.schedule};
                }
                return null;
            }

            /**
             * to add/update Schedule
             */
            doAction(entity){
                const {doAction} = this.props;
                doAction(entity, this);
            }

            render(){
                const {validationMessages} = this.state;
                const {t, openTour, closeTour, isTourOpen, schedule} = this.props;
                let {connections, descriptions} = this.mapConnections();
                let contentTranslations = {};
                contentTranslations.header = {title: t(`${this.translationKey}.HEADER`), onHelpClick: openTour};
                contentTranslations.cancel_button = {title: t(`app:FORM.CANCEL`), link: this.schedulePrefixUrl};
                contentTranslations.action_button = {title: t(`${this.translationKey}.${this.translationKey}_BUTTON`), link: this.schedulePrefixUrl};
                const parsedEntity = this.parseEntity();
                const connectionInput = this.isUpdate ? {...INPUTS.SCHEDULE_CONNECTION_TEXT, value: schedule.connection.title} : INPUTS.SCHEDULE_CONNECTION;
                const contents = [
                    {
                        inputs:[
                            {...INPUTS.SCHEDULE_TITLE,
                                error: validationMessages.title,
                                label: t(`${this.translationKey}.FORM.TITLE`),
                                defaultValue: ''
                            },
                            {...connectionInput,
                                error: validationMessages.connection,
                                label: t(`${this.translationKey}.FORM.CONNECTION`),
                                source: connections,
                                readonly: this.isUpdate,
                                required: true,
                                defaultValue: 0,
                                description: {name: 'description', label: t(`${this.translationKey}.FORM.DESCRIPTION`), values: descriptions},
                            },
                            {...INPUTS.SCHEDULE_CRON_EXPRESSION,
                                error: validationMessages.cronExp,
                                label: t(`${this.translationKey}.FORM.CRON_EXP`),
                                defaultValue: '',
                                required: true,
                                validateOnChange: ::this.validateCronExpOnChange
                            },
                        ],
                        hint: {text: t(`${this.translationKey}.FORM.HINT_1`), openTour},
                        header: t(`${this.translationKey}.FORM.PAGE_1`),
                    }
                ];
                return (
                    <React.Fragment>
                        <Form
                            contents={contents}
                            translations={contentTranslations}
                            isActionInProcess={this.props[this.actionName] === API_REQUEST_STATE.START}
                            permissions={SchedulePermissions}
                            clearValidationMessage={::this.clearValidationMessage}
                            action={::this.doAction}
                            entity={parsedEntity}
                            type={type}
                        />
                        <OCTour
                            steps={SCHEDULE_TOURS.page_1}
                            isOpen={isTourOpen}
                            onRequestClose={closeTour}
                        />
                    </React.Fragment>
                );
            }
        }
    }
}
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

import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import styles from '@entity/connection/components/themes/default/general/form_component.scss';
import FormSection from "@change_component/FormSection";
import {findTopLeft, isArray, isEmptyObject} from "@application/utils/utils";
import ListButton from "@entity/connection/components/components/general/view_component/ListButton";
import {ActionButton, SubFormSections} from "@change_component/FormComponents";
import CancelButton from "@entity/connection/components/components/general/view_component/CancelButton";

import {setConnectionData, setCurrentTechnicalItem} from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import { setModalConnectionData, setModalCurrentTechnicalItem } from '@entity/connection/redux_toolkit/slices/ModalConnectionSlice';
import CConnection from "@entity/connection/components/classes/components/content/connection/CConnection";
import {mapItemsToClasses} from "@change_component/form_elements/form_connection/form_svg/utils";
import CSvg from "@classes/content/connection_overview_2/CSvg";
import GetModalProp from '@entity/connection/components/decorators/GetModalProp';
import LicenseAlertMessage from "@entity/dashboard/components/license_alert_message/LicenseAlertMessage";
import {setEntityHeader} from "@application/redux_toolkit/slices/ApplicationSlice";

function mapStateToProps(state, props){
    const authUser = state.authReducer.authUser;
    const {currentTechnicalItem} = mapItemsToClasses(state, props.isModal);
    return {
        authUser,
        currentTechnicalItem,
    };
}

@GetModalProp()
@connect(
    mapStateToProps,
    {
        setConnectionData,
        setCurrentTechnicalItem,
        setModalConnectionData,
        setModalCurrentTechnicalItem,
        setEntityHeader
    }
)
class Form extends React.Component {
    constructor(props) {
        super(props);

        const onlyInputs = this.collectInputs(props.contents);

        let entity = [];
        if (!props.entity || isEmptyObject(props.entity)) {
            entity = this.getInputsState(onlyInputs);
        } else {
            entity = props.entity;
        }

        for (let i = 0; i < onlyInputs.length; i++) {
            if (onlyInputs[i].hasOwnProperty('callback')) {
                if (typeof onlyInputs[i].callback === 'function') {
                    onlyInputs[i].callback(entity[onlyInputs[i].name]);
                }
            }
        }

        this.state = {
            entity,
            page: 0,
            hasError: false,
            hasRequired: false,
            isValidated: true,
            focusedInput: {name: '', label: ''},
            validationMessage: '',
            makingRequest: false,
            contentsLength: props.contents ? props.contents.length : 0,
        };

        this.setData = props.isModal ? props.setModalConnectionData : props.setConnectionData;
        this.setCurrentTechnicalItem = props.isModal ? props.setModalCurrentTechnicalItem : props.setCurrentTechnicalItem;

        this.handleDoAction = this.doAction.bind(this);
        this.handleUpdateEntity = this.updateEntity.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            nextProps.contents !== this.props.contents ||
            nextProps.entity !== this.props.entity ||
            nextProps.translations !== this.props.translations ||
            nextProps.permissions !== this.props.permissions ||
            nextProps.isActionInProcess !== this.props.isActionInProcess ||
            nextProps.additionalButtons !== this.props.additionalButtons ||
            nextProps.clearValidationMessage !== this.props.clearValidationMessage ||
            nextProps.shouldScroll !== this.props.shouldScroll ||
            nextProps.type !== this.props.type ||
            nextProps.forceUpdateConnection !== this.props.forceUpdateConnection ||
            nextProps.currentTechnicalItem !== this.props.currentTechnicalItem ||
            nextState.entity !== this.state.entity ||
            nextState.page !== this.state.page ||
            nextState.hasError !== this.state.hasError ||
            nextState.hasRequired !== this.state.hasRequired ||
            nextState.isValidated !== this.state.isValidated ||
            nextState.validationMessage !== this.state.validationMessage ||
            nextState.makingRequest !== this.state.makingRequest ||
            nextState.contentsLength !== this.state.contentsLength
        );
    }

    componentDidMount() {
        this.props.setEntityHeader(this.props.translations.header);
    }

    componentDidUpdate(prevProps) {
        const prevErrors = this.getContentErrors(prevProps.contents);
        const curErrors = this.getContentErrors(this.props.contents);

        if (prevProps.forceUpdateConnection !== this.props.forceUpdateConnection && this.props.forceUpdateConnection) {
            this.updateEntity(this.props.entity);
        }

        if ((prevProps.entity?.id || null) !== (this.props.entity?.id || null)) {
            this.setState({
                entity: this.props.entity,
            });
        }

        if (!this.areErrorsEqual(prevErrors, curErrors)) {
            this.processErrors(curErrors);
        }
    }

    collectInputs(contents) {
        let onlyInputs = [];

        for (let i = 0; i < contents.length; i++) {
            if (isArray(contents[i])) {
                for (let j = 0; j < contents[i].length; j++) {
                    onlyInputs = onlyInputs.concat(contents[i][j].inputs);
                }
            } else {
                onlyInputs = onlyInputs.concat(contents[i].inputs);
            }
        }

        return onlyInputs;
    }

    getContentErrors(contents = []) {
        return contents.length > 2 ? contents[2].inputs[1]?.errors || {} : {};
    }

    areErrorsEqual(prevErrors = {}, curErrors = {}) {
        return JSON.stringify(prevErrors) === JSON.stringify(curErrors);
    }

    getCurrentItemFromErrors(entity, currentTechnicalItem, connectorType, operatorErrors = [], methodErrors = []) {
        const connector = connectorType === 'fromConnector'
            ? entity.fromConnector
            : entity.toConnector;

        let hasErrors = false;
        let currentItem = null;

        if (operatorErrors.length > 0) {
            hasErrors = connector.setErrorsForOperators(operatorErrors);
            currentItem = connector.getSvgElementByIndex(operatorErrors[0].index);
            const currentItemInConnector = connector.getCurrentItem();

            if (currentItemInConnector && currentItem) {
                if (
                    currentItemInConnector.index !== currentItem.entity.index ||
                    (currentTechnicalItem && currentItem.entity.index !== currentTechnicalItem.index)
                ) {
                    connector.setCurrentItem(currentItem.entity);
                } else {
                    currentItem = null;
                }
            }
        }

        if (methodErrors.length > 0) {
            hasErrors = connector.setErrorsForMethods(methodErrors) || hasErrors;
            if (!currentItem) {
                currentItem = connector.getSvgElementByIndex(methodErrors[0].index);
            }

            const currentItemInConnector = connector.getCurrentItem();
            if (currentItemInConnector && currentItem) {
                if (
                    currentItemInConnector.index !== currentItem.entity.index ||
                    (currentTechnicalItem && currentItem.entity.index !== currentTechnicalItem.index)
                ) {
                    connector.setCurrentItem(currentItem.entity);
                } else {
                    currentItem = null;
                }
            }
        }

        return { hasErrors, currentItem };
    }

    focusErroredSvgItem(currentItem) {
        if (!currentItem) return;

        this.setCurrentTechnicalItem(currentItem.getObject());

        const elementWithError = document.getElementById(
            `${currentItem.connectorType}__${currentItem.connectorType}_${currentItem.entity.index}`
        );

        if (elementWithError) {
            const firstElement = document.querySelector('[id^=fromConnector__fromConnector_0]');
            if (firstElement) {
                let viewBox = {x: -250, y: -50, width: 1800, height: 715};
                CSvg.setViewBox('technical_layout_svg', viewBox);

                const x = -300 + elementWithError.getBoundingClientRect().x - firstElement.getBoundingClientRect().x;
                const y = -100 + elementWithError.getBoundingClientRect().y - firstElement.getBoundingClientRect().y;

                viewBox = {x, y, width: 1800, height: 715};
                CSvg.setViewBox('technical_layout_svg', viewBox);
            }
        }
    }

    processErrors(curErrors = {}) {
        const {entity} = this.state;
        const {currentTechnicalItem} = this.props;

        if (!entity) return;

        const fromOperatorErrors = curErrors?.operators?.fromConnector || [];
        const toOperatorErrors = curErrors?.operators?.toConnector || [];
        const fromMethodErrors = curErrors?.methods?.fromConnector || [];
        const toMethodErrors = curErrors?.methods?.toConnector || [];

        const fromResult = this.getCurrentItemFromErrors(
            entity,
            currentTechnicalItem,
            'fromConnector',
            fromOperatorErrors,
            fromMethodErrors
        );

        const toResult = this.getCurrentItemFromErrors(
            entity,
            currentTechnicalItem,
            'toConnector',
            toOperatorErrors,
            toMethodErrors
        );

        const hasErrors = fromResult.hasErrors || toResult.hasErrors;
        const currentItem = fromResult.currentItem || toResult.currentItem;

        if (hasErrors) {
            if (currentItem) {
                this.focusErroredSvgItem(currentItem);
            }

            this.updateEntity(entity);
            this.setData({connection: entity.getObjectForConnectionOverview()});
            window.scrollTo({
                top: findTopLeft(`technical_layout_svg`).top - 4,
                behavior: "instant"
            });
        }
    }

    getInputsState(inputs) {
        let obj = {};
        if (Array.isArray(inputs)) {
            inputs.forEach(input => {
                obj[input.name] = input.hasOwnProperty('defaultValue') ? input.defaultValue : '';
            });
        }
        return obj;
    }

    updateEntity(entity, name) {
        this.setState({
            entity,
        });

        const connection = entity instanceof CConnection
            ? entity.getObjectForConnectionOverview()
            : entity;

        this.setData({connection});
        this.props.clearValidationMessage(name);
    }

    doAction() {
        const {entity} = this.state;
        const {action} = this.props;

        if (typeof action === 'function') {
            action(entity);
        }
    }

    renderButtonsPanel(entity, hasActionButton, hasListButton, hasCancelButton) {
        const {translations, permissions, isActionInProcess, additionalButtons, type} = this.props;

        if (type === 'update') {
            return null;
        }

        return (
            <React.Fragment>
                {hasActionButton && (
                    <ActionButton
                        {...this.props}
                        doAction={this.handleDoAction}
                        isActionInProcess={isActionInProcess}
                    />
                )}

                {hasListButton && (
                    <ListButton
                        title={translations.list_button.title}
                        link={translations.list_button.link}
                        permission={permissions.READ}
                    />
                )}

                {additionalButtons(entity, this.handleUpdateEntity)}

                {hasCancelButton && (
                    <CancelButton
                        title={translations.cancel_button.title}
                        link={translations.cancel_button.link}
                        permission={permissions.READ}
                    />
                )}
            </React.Fragment>
        );
    }

    renderContentSections(contents, entity) {
        const {clearValidationMessage, shouldScroll} = this.props;

        return contents.map((form, key1) => {
            if (isArray(form)) {
                return (
                    <SubFormSections
                        shouldScroll={shouldScroll}
                        key={key1}
                        key1={key1}
                        form={form}
                        contents={contents}
                        entity={entity}
                        clearValidationMessage={clearValidationMessage}
                        updateEntity={this.handleUpdateEntity}
                    />
                );
            }

            return (
                <FormSection
                    id={form?.id}
                    shouldScroll={shouldScroll}
                    key={key1}
                    isSubFormSection={false}
                    content={form}
                    entity={entity}
                    updateEntity={this.handleUpdateEntity}
                    clearValidationMessage={clearValidationMessage}
                />
            );
        });
    }

    render() {
        const {entity} = this.state;
        const {
            contents,
            translations,
        } = this.props;

        const hasActionButton = translations && translations.action_button;
        const hasListButton = translations && translations.list_button;
        const hasCancelButton = translations && translations.cancel_button;
        const visibleContentsCount = contents.filter(c => c.visible).length;
        const rowGap = visibleContentsCount > 1 ? '30px' : 0;

        return (
            <div style={{margin: '0 0 20px', padding: 0, paddingBottom: '30px'}}>
                <LicenseAlertMessage/>

                <div className={styles.buttons_panel}>
                    {this.renderButtonsPanel(entity, hasActionButton, hasListButton, hasCancelButton)}
                </div>

                <div
                    className={styles.form_component}
                    style={{rowGap}}
                >
                    {this.renderContentSections(contents, entity)}
                </div>
            </div>
        );
    }
}

Form.propTypes = {
    forceUpdateConnection: PropTypes.bool,
    shouldScroll: PropTypes.string,
    type: PropTypes.string,
    contents: PropTypes.array,
    translations: PropTypes.shape({
        header: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.object,
        ]),
        list_button: PropTypes.shape({
            title: PropTypes.string.isRequired,
            link: PropTypes.string.isRequired,
        }),
        cancel_button: PropTypes.shape({
            title: PropTypes.string.isRequired,
            link: PropTypes.string.isRequired,
        }),
        action_button: PropTypes.shape({
            title: PropTypes.string.isRequired,
            link: PropTypes.string,
        })
    }),
    isActionInProcess: PropTypes.bool,
    permissions: PropTypes.object,
    clearValidationMessage: PropTypes.func,
    action: PropTypes.func,
};

Form.defaultProps = {
    shouldScroll: '',
    type: 'add',
    contents: [],
    isActionInProcess: false,
    clearValidationMessage: () => {},
    action: () => {},
    additionalButtons: () => {},
    forceUpdateConnection: false,
};

export default Form;
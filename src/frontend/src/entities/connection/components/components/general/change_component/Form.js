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
import Title from "@app_component/collection/collection_title/Title";
import {mapItemsToClasses} from "@change_component/form_elements/form_connection/form_svg/utils";
import CSvg from "@classes/content/connection_overview_2/CSvg";
import GetModalProp from '@entity/connection/components/decorators/GetModalProp';

function mapStateToProps(state, props){
    const authUser = state.authReducer.authUser;
    const {currentTechnicalItem} = mapItemsToClasses(state, props.isModal);
    return {
        authUser,
        currentTechnicalItem,
    }
}

@GetModalProp()
@connect(mapStateToProps, {setConnectionData, setCurrentTechnicalItem, setModalConnectionData, setModalCurrentTechnicalItem})
class Form extends React.Component{
    constructor(props) {
        super(props);
        let onlyInputs = [];
        for(let i = 0; i < props.contents.length; i++){
            if(isArray(props.contents[i])){
                for(let j = 0; j < props.contents[i].length; j++){
                    onlyInputs = onlyInputs.concat(props.contents[i][j].inputs);
                }
            } else{
                onlyInputs = onlyInputs.concat(props.contents[i].inputs);
            }
        }
        let entity = [];
        if(!props.entity || isEmptyObject(props.entity)){
            entity = this.getInputsState(onlyInputs);
        } else{
            entity = props.entity;
        }
        for(let i = 0; i < onlyInputs.length; i++){
            if(onlyInputs[i].hasOwnProperty('callback')){
                if(typeof onlyInputs[i].callback === 'function'){
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
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const prevErrors = prevProps.contents.length > 2 ? prevProps.contents[2].inputs[1]?.errors || {} : {};
        const curErrors = this.props.contents.length > 2 ? this.props.contents[2].inputs[1]?.errors || {} : {};
        if(prevProps.entity.id !== this.props.entity.id){
            this.setState({
                entity: this.props.entity,
            })
        }
        if(JSON.stringify(prevErrors) !== JSON.stringify(curErrors)){
            const {entity} = this.state;
            const {currentTechnicalItem} = this.props;
            const fromConnectorErrors = curErrors.operators.fromConnector;
            const toConnectorErrors = curErrors.operators.toConnector;
            let hasErrors = false;
            let currentItem = null;
            if(fromConnectorErrors.length > 0){
                hasErrors = entity.fromConnector.setErrorsForOperators(fromConnectorErrors);
                currentItem = entity.fromConnector.getSvgElementByIndex(fromConnectorErrors[0].index);
                const currentItemInConnector = entity.fromConnector.getCurrentItem();
                if (currentItemInConnector) {
                    if (currentItemInConnector.index !== currentItem.entity.index || (currentTechnicalItem && currentItem.entity.index !== currentTechnicalItem.index)) {
                        entity.fromConnector.setCurrentItem(currentItem.entity);
                    } else{
                        currentItem = null;
                    }
                }
            }
            if(toConnectorErrors.length > 0){
                hasErrors = entity.toConnector.setErrorsForOperators(toConnectorErrors);
                currentItem = entity.toConnector.getSvgElementByIndex(toConnectorErrors[0].index);
                const currentItemInConnector = entity.toConnector.getCurrentItem();
                if (!currentItem && currentItemInConnector) {
                    if (currentItemInConnector.index !== currentItem.entity.index || (currentTechnicalItem && currentItem.entity.index !== currentTechnicalItem.index)) {
                        entity.toConnector.setCurrentItem(currentItem.entity);
                    } else{
                        currentItem = null;
                    }
                }
            }
            if(hasErrors){
                if(currentItem){
                    this.setCurrentTechnicalItem(currentItem.getObject());
                    const elementWithError = document.getElementById(`${currentItem.connectorType}__${currentItem.connectorType}_${currentItem.entity.index}`)
                    if(elementWithError){
                        const firstElement = document.querySelector('[id^=fromConnector__fromConnector_0]');
                        if(firstElement){
                            let viewBox = {x: -250, y: -50, width: 1800, height: 715};
                            CSvg.setViewBox('technical_layout_svg', viewBox);
                            const x = -300 + elementWithError.getBoundingClientRect().x - firstElement.getBoundingClientRect().x;
                            const y = -100 + elementWithError.getBoundingClientRect().y - firstElement.getBoundingClientRect().y;
                            viewBox = {x, y, width: 1800, height: 715};
                            CSvg.setViewBox('technical_layout_svg', viewBox);
                        }
                    }
                }
                this.updateEntity(entity);
                this.setData({connection: entity.getObjectForConnectionOverview()});
                window.scrollTo({top: findTopLeft(`technical_layout_svg`).top - 4, behavior: "instant"});
            }
        }
    }

    getInputsState(inputs){
        let obj = {};
        if(Array.isArray(inputs)) {
            inputs.forEach(input => {
                return input.hasOwnProperty('defaultValue') ? obj[input.name] = input.defaultValue : obj[input.name] = '';
            });
        }
        return obj;
    }

    updateEntity(entity, name){
        this.setState({
            entity,
        });
        let connection = entity instanceof CConnection ? entity.getObjectForConnectionOverview() : entity;
        this.setData({connection});
        this.props.clearValidationMessage(name);
    }

    doAction(){
        const {entity} = this.state;
        const {action} = this.props;
        if(typeof action === 'function'){
            action(entity);
        }
    }

    render(){
        const {entity} = this.state;
        const {contents, translations, permissions, isActionInProcess, additionalButtons, clearValidationMessage} = this.props;
        const hasActionButton = translations && translations.action_button;
        const hasListButton = translations && translations.list_button;
        const hasCancelButton = translations && translations.cancel_button;
        return(
            <div style={{margin: '20px 0', padding: 0, paddingBottom: '30px'}}>
                <Title title={translations.header}/>
                <div className={styles.buttons_panel}>
                    {hasActionButton &&
                        <ActionButton
                            {...this.props}
                            doAction={(a) => this.doAction(a)}
                            isActionInProcess={isActionInProcess}
                        />
                    }
                    {hasListButton &&
                        <ListButton
                            title={translations.list_button.title}
                            link={translations.list_button.link}
                            permission={permissions.READ}
                        />
                    }
                    {
                        additionalButtons(entity)
                    }
                    {hasCancelButton &&
                        <CancelButton
                            title={translations.cancel_button.title}
                            link={translations.cancel_button.link}
                            permission={permissions.READ}
                        />
                    }
                </div>
                <div className={styles.form_component}>
                    {
                        contents.map((form, key1) => {
                            if(isArray((form))){
                                return (
                                    <SubFormSections
                                        key={key1}
                                        key1={key1}
                                        form={form}
                                        contents={contents}
                                        entity={entity}
                                        clearValidationMessage={clearValidationMessage}
                                        updateEntity={(a, b) => this.updateEntity(a, b)}
                                    />
                                );
                            } else {
                                return (
                                    <FormSection
                                        key={key1}
                                        isSubFormSection={false}
                                        content={form}
                                        entity={entity}
                                        updateEntity={(a, b) => this.updateEntity(a, b)}
                                        clearValidationMessage={clearValidationMessage}
                                    />
                                );
                            }
                        })
                    }
                </div>
            </div>
        );
    }
}

Form.propTypes = {
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
}

Form.defaultProps = {
    type: 'add',
    contents: [],
    isActionInProcess: false,
    clearValidationMessage: () => {},
    action: () => {},
    additionalButtons: () => {},
};

export default Form;

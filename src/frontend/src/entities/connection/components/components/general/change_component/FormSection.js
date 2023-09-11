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

import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { setFullScreen as setFullScreenFormSection } from "@application/redux_toolkit/slices/ApplicationSlice";

import FormInput from "./form_elements/FormInput";
import FormSelect from "./form_elements/FormSelect";
import FormInputImage from "./form_elements/FormInputImage";
import FormSelectDescription from "./form_elements/FormSelectDescription";
import FormMultiSelect from "./form_elements/FormMultiSelect";
import FormSecretInput from "./form_elements/FormSecretInput";
import FormConnectors from "./form_elements/form_connection/form_connectors/FormConnectors";
import FormMethods from "./form_elements/form_connection/form_methods/FormMethods";
import { findTopLeft, isString } from "@application/utils/utils";
import FormMode from "./form_elements/form_connection/FormMode";
import FormConnectionTitle from "./form_elements/form_connection/FormTitle";
import FormUserTitle from "./form_elements/FormUserTitle";
import FormInvokerName from "./form_elements/form_invoker/FormName";
import FormInvokerDescription from "./form_elements/form_invoker/FormDescription";
import FormInvokerHint from "./form_elements/form_invoker/FormHint";
import FormInvokerIcon from "./form_elements/form_invoker/FormIcon";
import FormAuthentication from "./form_elements/form_invoker/FormAuthentication";
import FormConnection from "./form_elements/form_invoker/FormConnection";
import FormOperations from "./form_elements/form_invoker/FormOperations";
import FormNotificationTemplateName from "./form_elements/form_notification_template/FormName";
import FormNotificationTemplateType from "./form_elements/form_notification_template/FormType";
import FormContent from "./form_elements/form_notification_template/FormContent";
import FormComponent from "@change_component/form_elements/FormComponent";
import FormConnectionSvg from "@change_component/form_elements/form_connection/form_svg/FormConnectionSvg";

import styles from "@entity/connection/components/themes/default/general/form_component.scss";
import TestButton from "@change_component/form_elements/TestButton";
import TooltipFontIcon from "@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon";
import FormUserGroupView from "@change_component/form_elements/FormUserGroupView";
import FormUserPhoto from "@change_component/form_elements/FormUserPhoto";
import FormUserGroupIcon from "@change_component/form_elements/FormUserGroupIcon";
import FormSwitch from "@change_component/form_elements/FormSwitch";
import { Label } from "@app_component/form/form_section/label/Label";
import { FormSectionIconsStyled } from "./styles";
import { withTheme } from "styled-components";

export const ModalContext = React.createContext({
  isModal: false,
});

function mapStateToProps(state) {
  const isOneFormSectionFullScreen = state.applicationReducer.isFullScreen;
  return {
    isOneFormSectionFullScreen,
  };
}

/**
 * FormSection Component
 */
@connect(mapStateToProps, { setFullScreenFormSection })
class FormSection extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isFormSectionMinimized: false,
    };
  }

  toggle() {
    if (!this.props.content.hasFullScreenFunction) {
      this.setState({
        isFormSectionMinimized: !this.state.isFormSectionMinimized,
      });
    }
  }

  componentDidMount() {
      if(!!this.props.shouldScroll){
          window.scrollTo({top: findTopLeft(`form_section_label_${this.props.shouldScroll}`).top - 4, behavior: "smooth"});
      }
  }

  /**
   * to map Field Inputs correspondingly
   */
  mapInputs(data, key) {
    const { entity, updateEntity, clearValidationMessage } = this.props;
    switch (data.type) {
      case "select+description":
        return (
          <FormSelectDescription
            key={key}
            entity={entity}
            updateEntity={updateEntity}
            data={data}
          />
        );
      case "select":
        return (
          <FormSelect
            key={key}
            entity={entity}
            updateEntity={updateEntity}
            data={data}
          />
        );
      case "multiselect":
        return (
          <FormMultiSelect
            key={key}
            entity={entity}
            updateEntity={updateEntity}
            data={data}
          />
        );
      case "file":
        return (
          <FormInputImage
            key={key}
            entity={entity}
            updateEntity={updateEntity}
            data={data}
          />
        );
      case "secret":
        return (
          <FormSecretInput
            key={key}
            entity={entity}
            updateEntity={updateEntity}
            data={data}
          />
        );
      case "component":
        return (
          <FormComponent
            key={key}
            entity={entity}
            updateEntity={updateEntity}
            data={data}
          />
        );
      case "password":
      case "text":
      case "email":
      case "textarea":
        return (
          <FormInput
            key={key}
            entity={entity}
            updateEntity={updateEntity}
            data={data}
          />
        );
      case "connection_title":
        return (
          <FormConnectionTitle
            key={key}
            entity={entity}
            updateEntity={updateEntity}
            data={data}
            clearValidationMessage={clearValidationMessage}
          />
        );
      case "connectors":
        return (
          <FormConnectors
            key={key}
            entity={entity}
            updateEntity={updateEntity}
            data={data}
          />
        );
      case "connection_mode":
        return (
          <FormMode
            key={key}
            entity={entity}
            updateEntity={updateEntity}
            data={data}
          />
        );
      case "methods":
        return (
          <FormMethods
            key={key}
            entity={entity}
            updateEntity={updateEntity}
            data={data}
          />
        );
      case "connection_svg":
        return (
          <ModalContext.Provider key={key} value={{ isModal: false }}>
            <FormConnectionSvg
              entity={entity}
              updateEntity={updateEntity}
              data={data}
            />
          </ModalContext.Provider>
        );
      case "invoker_name":
        return (
          <FormInvokerName
            key={key}
            entity={entity}
            updateEntity={updateEntity}
            data={data}
          />
        );
      case "invoker_description":
        return (
          <FormInvokerDescription
            key={key}
            entity={entity}
            updateEntity={updateEntity}
            data={data}
          />
        );
      case "invoker_hint":
        return (
          <FormInvokerHint
            key={key}
            entity={entity}
            updateEntity={updateEntity}
            data={data}
          />
        );
      case "invoker_icon":
        return (
          <FormInvokerIcon
            key={key}
            entity={entity}
            updateEntity={updateEntity}
            data={data}
          />
        );
      case "invoker_connection":
        return (
          <FormConnection
            key={key}
            entity={entity}
            updateEntity={updateEntity}
            data={data}
            clearValidationMessage={clearValidationMessage}
          />
        );
      case "invoker_authentication":
        return (
          <FormAuthentication
            key={key}
            entity={entity}
            updateEntity={updateEntity}
            data={data}
          />
        );
      case "invoker_operations":
        return (
          <FormOperations
            key={key}
            entity={entity}
            updateEntity={updateEntity}
            data={data}
            clearValidationMessage={clearValidationMessage}
          />
        );
      case "user_title":
        return (
          <FormUserTitle
            key={key}
            entity={entity}
            updateEntity={updateEntity}
            data={data}
          />
        );
      case "notification_template_name":
        return (
          <FormNotificationTemplateName
            key={key}
            entity={entity}
            updateEntity={updateEntity}
            data={data}
          />
        );
      case "notification_template_type":
        return (
          <FormNotificationTemplateType
            key={key}
            entity={entity}
            updateEntity={updateEntity}
            data={data}
          />
        );
      case "notification_template_content":
        return (
          <FormContent
            key={key}
            entity={entity}
            updateEntity={updateEntity}
            data={data}
          />
        );
      case "user_group_view":
        return <FormUserGroupView key={key} entity={entity} data={data} />;
      case "user_photo_view":
        return <FormUserPhoto key={key} entity={entity} data={data} />;
      case "user_group_icon_view":
        return <FormUserGroupIcon key={key} entity={entity} data={data} />;
      case "switch":
        return (
          <FormSwitch
            key={key}
            entity={entity}
            updateEntity={updateEntity}
            data={data}
          />
        );
      case "test_button":
        return <TestButton key={key} entity={entity} data={data} />;
    }
    return null;
  }

  /**
   * to generate Input Fields
   */
  generateInputs() {
    let result;
    const { content, focusedInput, setFocusInput } = this.props;
    if (Array.isArray(content.inputs)) {
      result = content.inputs.map((data, key) => {
        data["tourStep"] =
          data["tourStep"] && isString(data["tourStep"])
            ? data["tourStep"].substr(1)
            : data["tourStep"];
        data["setFocusInput"] = setFocusInput;
        data["focused"] = focusedInput !== "" && focusedInput === data.name;
        data["visible"] = data.hasOwnProperty("visible") ? data.visible : true;
        return this.mapInputs(Object.assign({}, data), key);
      });
    }
    return result.map((Element) => {
      return Element;
    });
  }

    render(){
        const {isFormSectionMinimized} = this.state;
        const {isSubFormSection, isOneFormSectionFullScreen, } = this.props;
        let style = {};
        const content = {
            visible: true,
            header: '',
            formClassName: '',
            hasFullScreenFunction: false,
            AdditionalIcon: null,
            ...this.props.content,
        };
        if(!content.visible){
            style.height = 0;
            style.overflow = 'hidden';
            style.padding = 0;
            style.margin = 0;
        }
        const hasHeader = content.header !== '' && !isOneFormSectionFullScreen;/*
        if(isOneFormSectionFullScreen && (!content.hasOwnProperty('hasFullScreenFunction') || !content.hasFullScreenFunction)){
            return null;
        }*/
        const hasIcons = content.hasFullScreenFunction || !!content.AdditionalIcon;
        return (
            <div
                className={`${!isSubFormSection ? styles.form : ''} ${
                  content.visible ? content.formClassName : ''
                } ${isFormSectionMinimized ? styles.minimized_form : ''} ${
                  isOneFormSectionFullScreen ? styles.full_screen : ''
                }`}
                style={style}
            >
                {hasHeader &&
                    <Label id={`form_section_label_${content.header}`} value={content.header} position={'absolute'}/>
                }
                {hasIcons &&
                    <div className={styles.form_methods_icons}>
                        <FormSectionIconsStyled>
                            <div>...</div>
                            <div>
                                {
                                    content.AdditionalIcon
                                }
                            </div>
                        </FormSectionIconsStyled>
                    </div>
                }
                {this.generateInputs()}
                {content.hasHint &&
                <div className={styles.hint_area}>
                    <span className={styles.hint}>
                        {`Hint: `}
                    </span>
                    {content.hint.text}
                </div>}
            </div>
        );
    }
}

FormSection.propTypes = {
  entity: PropTypes.object.isRequired,
  updateEntity: PropTypes.func.isRequired,
  focusedInput: PropTypes.string,
  isSubFormSection: PropTypes.bool,
  content: PropTypes.shape({
    header: PropTypes.string,
    visible: PropTypes.bool,
    inputs: PropTypes.array.isRequired,
    formClassName: PropTypes.string,
  }).isRequired,
};

FormSection.defaultProps = {
  focusedInput: "",
  isSubFormSection: false,
};

export default withTheme(FormSection);

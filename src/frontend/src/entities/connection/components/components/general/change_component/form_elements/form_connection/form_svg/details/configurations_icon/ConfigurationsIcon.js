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

import React, {ChangeEvent} from "react";
import PropTypes from "prop-types";
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import Dialog from "@entity/connection/components/components/general/basic_components/Dialog";
import { connect } from "react-redux";
import { setPanelConfigurations } from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import { setModalPanelConfigurations } from "@entity/connection/redux_toolkit/slices/ModalConnectionSlice";
import ColorMode from "@change_component/form_elements/form_connection/form_svg/details/configurations_icon/ColorMode";
import { TooltipButton } from "@app_component/base/tooltip_button/TooltipButton";
import { TextSize } from "@app_component/base/text/interfaces";
import LabelSize from "@change_component/form_elements/form_connection/form_svg/details/configurations_icon/LabelSize";
import { ColorTheme } from "@style/Theme";
import GetModalProp from '@entity/connection/components/decorators/GetModalProp';
import {mapItemsToClasses} from "@change_component/form_elements/form_connection/form_svg/utils";
import InputText from "@app_component/base/input/text/InputText";
import InputTextarea from "@app_component/base/input/textarea/InputTextarea";
import {setFocusById} from "@application/utils/utils";
import {
  getAndUpdateConnectionDescription,
  getAndUpdateConnectionTitle
} from "@root/redux_toolkit/action_creators/ConnectionCreators";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";

function mapStateToProps(state, props) {
  const { connectionOverview, connection } = mapItemsToClasses(state, props.isModal);
  return {
    colorMode: connectionOverview.colorMode,
    processTextSize: connectionOverview.processTextSize,
    connection,
  };
}

@GetModalProp()
@connect(mapStateToProps, {
  setPanelConfigurations, setModalPanelConfigurations, getAndUpdateConnectionDescription,
  getAndUpdateConnectionTitle,
})
class ConfigurationsIcon extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isVisibleSettingsWindow: false,
      colorMode: props.colorMode,
      processTextSize: props.processTextSize,
      title: props?.connection ? props.connection.title : '',
      description: props?.connection ? props.connection.description: '',
      validationMessageTitle: '',
      validationMessageDescription: '',
    };
  }

  setTitle(title){
    this.setState({title, validationMessageTitle: ''});
  }

  setDescription(newDescription){
    this.setState({description: newDescription, validationMessageDescription: ''});
  }

  toggleIsVisibleSettingsWindow() {
    if(!this.state.isVisibleSettingsWindow){
      setFocusById('settings_input_title', 500);
      this.setState({
        title: this.props.connection.title,
        description: this.props.connection.description,
        validationMessageTitle: '',
        validationMessageDescription: '',

      })
    }
    this.setState(
      {
        isVisibleSettingsWindow: !this.state.isVisibleSettingsWindow,
      },
      () => {
        if (!this.state.isVisibleSettingsWindow) {
          setTimeout(() => document.activeElement.blur(), 500);
        }
      }
    );
  }

  onChangeColorMode(colorMode) {
    this.setState({
      colorMode,
    });
  }

  onChangeProcessTextSize(processTextSize) {
    this.setState({
      processTextSize,
    });
  }

  save() {
    const { colorMode, processTextSize, title, description } = this.state;
    const {
      connection, setPanelConfigurations, setModalPanelConfigurations,
      isModal, getAndUpdateConnectionDescription, getAndUpdateConnectionTitle,
      updateConnection,
    } = this.props;
    if(connection.id) {
      const connectionObj = connection.getObject();
      if (title === '') {
        this.setState({validationMessageTitle: 'Title is a required field'});
        setFocusById('settings_input_title');
        return;
      }
      if (title !== connection.title) {
        connection.title = title;
        connection.description = description;
        getAndUpdateConnectionTitle({...connectionObj, title, description});
      } else if (description !== connection.description) {
        connection.description = description;
        getAndUpdateConnectionDescription({...connectionObj, description});
      }
      updateConnection(connection);
    }
    if(isModal){
      setModalPanelConfigurations({
        colorMode,
        processTextSize,
      });
    } else{
      setPanelConfigurations({
        colorMode,
        processTextSize,
      });
    }
    this.setState({
      title: '',
      description: '',
    })
    this.toggleIsVisibleSettingsWindow();
  }

  render() {
    const { isVisibleSettingsWindow, colorMode, title, validationMessageTitle, validationMessageDescription, description, processTextSize } = this.state;
    const { disabled, readOnly, connection } = this.props;
    return (
      <React.Fragment>
        <TooltipButton
          size={TextSize.Size_20}
          position={"bottom"}
          className={styles.configurations_icon}
          icon={"settings"}
          tooltip={disabled ? "" : "Settings"}
          target={`settings_connection_button`}
          hasBackground={true}
          background={
            isVisibleSettingsWindow ? ColorTheme.Blue : ColorTheme.White
          }
          color={isVisibleSettingsWindow ? ColorTheme.White : ColorTheme.Gray}
          padding="2px"
          isDisabled={disabled}
          handleClick={() => this.toggleIsVisibleSettingsWindow()}
        />
        <Dialog
          actions={[
            { label: "Save", onClick: (a) => this.save(a) },
            {
              label: "Cancel",
              onClick: (a) => this.toggleIsVisibleSettingsWindow(a),
            },
          ]}
          active={isVisibleSettingsWindow}
          toggle={(a) => this.toggleIsVisibleSettingsWindow(a)}
          title={"Settings"}
          hasAutoFocus={false}
        >
          <React.Fragment>
            {connection.id &&
                <React.Fragment>
                  <InputText
                      id={`settings_input_title`}
                      icon={'title'}
                      label={'Title'}
                      maxLength={256}
                      onChange={(e) => this.setTitle(e.target.value)}
                      value={title}
                      error={validationMessageTitle}
                      readOnly={readOnly}
                      required
                  />
                  <InputTextarea
                      id={`settings_input_description`}
                      icon={'notes'}
                      label={'Description'}
                      error={validationMessageDescription}
                      onChange={(e) => this.setDescription(e.target.value)}
                      value={description}
                      readOnly={readOnly}
                  />
                </React.Fragment>
            }
            <ColorMode
              colorMode={colorMode}
              onChangeColorMode={(a) => this.onChangeColorMode(a)}
            />
            <div style={{ marginTop: "20px" }}>
              <LabelSize
                value={processTextSize}
                onChange={(a) => this.onChangeProcessTextSize(a)}
              />
            </div>
          </React.Fragment>
        </Dialog>
      </React.Fragment>
    );
  }
}

ConfigurationsIcon.propTypes = {
  disabled: PropTypes.bool,
};

ConfigurationsIcon.defaultProps = {
  disabled: false,
};

export default ConfigurationsIcon;

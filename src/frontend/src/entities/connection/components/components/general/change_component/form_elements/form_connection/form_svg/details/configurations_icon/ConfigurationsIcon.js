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

import React from "react";
import PropTypes from "prop-types";
import TooltipFontIcon from "@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon";
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import Dialog from "@entity/connection/components/components/general/basic_components/Dialog";
import { connect } from "react-redux";
import { setPanelConfigurations } from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import ColorMode from "@change_component/form_elements/form_connection/form_svg/details/configurations_icon/ColorMode";
import { TooltipButton } from "@app_component/base/tooltip_button/TooltipButton";
import { TextSize } from "@app_component/base/text/interfaces";
import LabelSize from "@change_component/form_elements/form_connection/form_svg/details/configurations_icon/LabelSize";
import { ColorTheme } from "@style/Theme";

function mapStateToProps(store) {
  const connectionOverview = store.connectionReducer;
  return {
    colorMode: connectionOverview.colorMode,
  };
}

@connect(mapStateToProps, { setPanelConfigurations })
class ConfigurationsIcon extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isVisibleSettingsWindow: false,
      colorMode: props.colorMode,
    };
  }

  toggleIsVisibleSettingsWindow() {
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

  save() {
    const { colorMode } = this.state;
    const { setPanelConfigurations } = this.props;
    setPanelConfigurations({ colorMode });
    this.toggleIsVisibleSettingsWindow();
  }

  render() {
    const { isVisibleSettingsWindow, colorMode } = this.state;
    const { disabled, tooltipPosition } = this.props;

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
            <ColorMode
              colorMode={colorMode}
              onChangeColorMode={(a) => this.onChangeColorMode(a)}
            />
            <div style={{ marginTop: "20px" }}>
              <LabelSize />
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

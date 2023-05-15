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
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import { findTopLeft } from "@application/utils/utils";
import { connect } from "react-redux";
import { mapItemsToClasses } from "@change_component/form_elements/form_connection/form_svg/utils";
import TestBlock from "./test_block/TestBlock";
import ControlsBlock from "./controls_block/ControlsBlock";
import HelpBlock from "./help_block/HelpBlock";
import GetModalProp from "@entity/connection/components/decorators/GetModalProp";

function mapStateToProps(state, props) {
  const connectionOverview = state.connectionReducer;
  const applicationOverview = state.applicationReducer;
  const { connection } = mapItemsToClasses(state, props.isModal);

  return {
    connection,
    isFullScreen: applicationOverview.isFullScreen,
    isDetailsOpened: connectionOverview.isDetailsOpened,
    logPanelHeight: connectionOverview.logPanelHeight,
    moveTestButton: connectionOverview.moveTestButton,
    isButtonPanelOpened: connectionOverview.isButtonPanelOpened,
  };
}

@GetModalProp()
@connect(mapStateToProps)
class ButtonPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isFullScreen: props.isFullScreen,
      isHelpPanelOpened: props.isHelpPanelOpened,
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.props.isFullScreen !== this.state.isFullScreen) {
      this.setState(
        {
          isFullScreen: this.props.isFullScreen,
        },
        () =>
          window.scrollTo({
            top: findTopLeft(`technical_layout_svg`).top - 4,
            behavior: "instant",
          })
      );
    }
    const buttonPanel = document.querySelector("#button_panel");
    buttonPanel.style.bottom = `${this.props.logPanelHeight + 48}px`;

    const testConnectionButton = document.querySelector(
      "#test_connection_button"
    );
    testConnectionButton.style.margin = `0 ${this.props.moveTestButton / 2}px ${
      this.props.moveTestButton
    }px 0`;
  }

  render() {
    const { readOnly, isButtonPanelOpened, isDetailsOpened } = this.props;
    return (
      <div
        id="button_panel"
        className={`${styles.button_panel} ${
          !isButtonPanelOpened && styles.button_panel_active
        } ${isDetailsOpened && styles.button_panel_details_opened}`}
      >
        <TestBlock />
        {isButtonPanelOpened && <div className={styles.button_panel_divider} />}
        <ControlsBlock
          data={this.props.data}
          readOnly={readOnly}
          connection={this.props.connection}
        />
        {isButtonPanelOpened && <div className={styles.button_panel_divider} />}
        <HelpBlock />
      </div>
    );
  }
}

export default ButtonPanel;

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
import styles from '@entity/connection/components/themes/default/content/connections/connection_overview_2';
import { TooltipButton } from '@app_component/base/tooltip_button/TooltipButton';
import { TextSize } from '@app_component/base/text/interfaces';

class SettingsPanel extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { isDetailsOpened, toggleDetails, isTestingConnection } = this.props;
    return (
      <div className={styles.details_settings_panel}>
        <TooltipButton
          isDisabled={isTestingConnection}
          size={TextSize.Size_20}
          position={'bottom'}
          className={styles.position_icon_left}
          icon={!isDetailsOpened ? 'chevron_left' : 'chevron_right'}
          tooltip={!isDetailsOpened ? 'Show Details' : 'Hide'}
          target={`toggle_connection_button`}
          hasBackground={false}
          handleClick={toggleDetails}
        />
      </div>
    );
  }
}

export default SettingsPanel;

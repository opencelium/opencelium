/*
 *  Copyright (C) <2022>  <becon GmbH>
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
import TooltipFontIcon from "@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon";
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import {findTopLeft} from "@application/utils/utils";
import {connect} from "react-redux";
import {setFullScreen as setFullScreenFormSection} from "@application/redux_toolkit/slices/ApplicationSlice";
import ConfigurationsIcon
    from "@change_component/form_elements/form_connection/form_svg/details/configurations_icon/ConfigurationsIcon";


@connect(null, {setFullScreenFormSection})
class SettingsPanel extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            isFullScreen: false,
        }
    }

    toggleFullScreen(){
        this.setState({
            isFullScreen: !this.state.isFullScreen,
        }, () => window.scrollTo({top: findTopLeft(`technical_layout_svg`).top - 4, behavior: "instant"}));
        this.props.setFullScreenFormSection(!this.state.isFullScreen)
    }

    render(){
        const {isFullScreen} = this.state;
        const {togglePanel, isHidden} = this.props;
        return(
            <div className={styles.details_settings_panel}>
                <TooltipFontIcon size={20} tooltipPosition={'bottom'} isButton
                                 className={styles.position_icon_left}
                                 value={isFullScreen ? 'close_fullscreen' : 'open_in_full'}
                                 tooltip={isFullScreen ? 'Minimize' : 'Maximize'}
                                 onClick={() => this.toggleFullScreen()}/>
                <ConfigurationsIcon/>
                <TooltipFontIcon size={24} tooltipPosition={'bottom'} isButton
                                 className={styles.position_icon_left}
                                 value={isHidden ? 'chevron_left' : 'chevron_right'}
                                 tooltip={isHidden ? 'Show' : 'Hide'}
                                 onClick={() => togglePanel()}/>
            </div>
        );
    }
}

export default SettingsPanel;
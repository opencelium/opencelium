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
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import {COLOR_MODE} from "@entity/connection/components/classes/components/content/connection_overview_2/CSvg";

class ColorMode extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {colorMode, onChangeColorMode} = this.props;
        return(
            <React.Fragment>
                <div className={styles.configurations_icon_title}>Position of the process color:</div>
                <div className={styles.configurations_icon_process_color_modes}>
                    <div style={{borderColor: colorMode === COLOR_MODE.RECTANGLE_TOP ? '#5369a8' : 'black'}} className={styles.configurations_icon_process_color_mode_1} onClick={() => onChangeColorMode(COLOR_MODE.RECTANGLE_TOP)}>
                        <div className={styles.label}/>
                        <div className={styles.text}>
                            {'Process'}
                        </div>
                    </div>
                    <div style={{borderColor: colorMode === COLOR_MODE.BACKGROUND ? '#5369a8' : 'black'}} className={styles.configurations_icon_process_color_mode_2} onClick={() => onChangeColorMode(COLOR_MODE.BACKGROUND)}>
                        <div className={styles.text}>
                            {'Process'}
                        </div>
                    </div>
                    <div style={{borderColor: colorMode === COLOR_MODE.CIRCLE_LEFT_TOP ? '#5369a8' : 'black'}} className={styles.configurations_icon_process_color_mode_3} onClick={() => onChangeColorMode(COLOR_MODE.CIRCLE_LEFT_TOP)}>
                        <div className={styles.label}/>
                        <div className={styles.text}>
                            {'Process'}
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

ColorMode.propTypes = {
    colorMode: PropTypes.oneOf(['RECTANGLE_TOP', 'BACKGROUND', 'CIRCLE_LEFT_TOP']).isRequired,
    onChangeColorMode: PropTypes.func.isRequired,
};

export default ColorMode;
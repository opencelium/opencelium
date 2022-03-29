import React from 'react';
import PropTypes from 'prop-types';
import styles from "@themes/default/content/connections/connection_overview_2";
import {COLOR_MODE} from "@classes/components/content/connection_overview_2/CSvg";

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
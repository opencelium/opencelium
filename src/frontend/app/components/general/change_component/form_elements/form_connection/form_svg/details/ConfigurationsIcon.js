import React from 'react';
import PropTypes from 'prop-types';
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import styles from "@themes/default/content/connections/connection_overview_2";
import Dialog from "@basic_components/Dialog";
import {connect} from "react-redux";
import {setColorMode} from "@actions/connection_overview_2/set";

function mapStateToProps(store){
    return{
        colorMode: store.get('connection_overview').get('colorMode'),
    }
}

@connect(mapStateToProps, {setColorMode})
class ConfigurationsIcon extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            isVisibleSettingsWindow: false,
            colorMode: props.colorMode,
        };
    }

    toggleIsVisibleSettingsWindow(){
        this.setState({
            isVisibleSettingsWindow: !this.state.isVisibleSettingsWindow,
        })
    }

    onChangeColorMode(colorMode){
        this.setState({
            colorMode,
        })
    }

    save(){
        this.props.setColorMode(this.state.colorMode);
        this.toggleIsVisibleSettingsWindow();
    }

    render(){
        const {isVisibleSettingsWindow, colorMode} = this.state;
        const {disabled} = this.props;
        return(
            <React.Fragment>
                <TooltipFontIcon
                    size={20}
                    className={styles.configurations_icon}
                    onClick={::this.toggleIsVisibleSettingsWindow}
                    tooltip={disabled ? '' : 'Settings'}
                    value={'settings'}
                    tooltipPosition={'top'}
                    disabled={disabled}
                    isButton={true}
                />
                <Dialog
                    actions={[{label: 'Save', onClick: ::this.save}, {label: 'Cancel', onClick: ::this.toggleIsVisibleSettingsWindow}]}
                    active={isVisibleSettingsWindow}
                    toggle={::this.toggleIsVisibleSettingsWindow}
                    title={'Settings'}
                >
                    <React.Fragment>
                        <div className={styles.configurations_icon_process_color_title}>Position of the process color:</div>
                        <div className={styles.configurations_icon_process_color_modes}>
                            <div style={{borderColor: colorMode === 0 ? '#5369a8' : 'black'}} className={styles.configurations_icon_process_color_mode_1} onClick={() => ::this.onChangeColorMode(0)}>
                                <div className={styles.label}/>
                                <div className={styles.text}>
                                    {'Process'}
                                </div>
                            </div>
                            <div style={{borderColor: colorMode === 1 ? '#5369a8' : 'black'}} className={styles.configurations_icon_process_color_mode_2} onClick={() => ::this.onChangeColorMode(1)}>
                                <div className={styles.text}>
                                    {'Process'}
                                </div>
                            </div>
                            <div style={{borderColor: colorMode === 2 ? '#5369a8' : 'black'}} className={styles.configurations_icon_process_color_mode_3} onClick={() => ::this.onChangeColorMode(2)}>
                                <div className={styles.label}/>
                                <div className={styles.text}>
                                    {'Process'}
                                </div>
                            </div>
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
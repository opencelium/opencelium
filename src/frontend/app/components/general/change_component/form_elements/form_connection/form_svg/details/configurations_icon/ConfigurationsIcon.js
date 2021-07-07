import React from 'react';
import PropTypes from 'prop-types';
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import styles from "@themes/default/content/connections/connection_overview_2";
import Dialog from "@basic_components/Dialog";
import {connect} from "react-redux";
import {setPanelConfigurations} from "@actions/connection_overview_2/set";
import ColorMode from "@change_component/form_elements/form_connection/form_svg/details/configurations_icon/ColorMode";
import BusinessLabelMode
    from "@change_component/form_elements/form_connection/form_svg/details/configurations_icon/BusinessLabelMode";

function mapStateToProps(store){
    const connectionOverview = store.get('connection_overview');
    return{
        colorMode: connectionOverview.get('colorMode'),
        businessLabelMode: connectionOverview.get('businessLabelMode'),
    }
}

@connect(mapStateToProps, {setPanelConfigurations})
class ConfigurationsIcon extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            isVisibleSettingsWindow: false,
            colorMode: props.colorMode,
            businessLabelMode: props.businessLabelMode,
        };
    }

    toggleIsVisibleSettingsWindow(){
        this.setState({
            isVisibleSettingsWindow: !this.state.isVisibleSettingsWindow,
        }, () => {
            if(!this.state.isVisibleSettingsWindow){
                setTimeout(() => document.activeElement.blur(), 500);
            }
        })
    }

    onChangeColorMode(colorMode){
        this.setState({
            colorMode,
        })
    }

    onChangeBusinessLabelMode(businessLabelMode){
        this.setState({
            businessLabelMode,
        })
    }

    save(){
        const {colorMode, businessLabelMode} = this.state;
        const {setPanelConfigurations} = this.props;
        setPanelConfigurations({colorMode, businessLabelMode});
        this.toggleIsVisibleSettingsWindow();
    }

    render(){
        const {isVisibleSettingsWindow, colorMode, businessLabelMode} = this.state;
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
                        <ColorMode colorMode={colorMode} onChangeColorMode={::this.onChangeColorMode}/>
                        <BusinessLabelMode businessLabelMode={businessLabelMode} onChangeBusinessLabelMode={::this.onChangeBusinessLabelMode}/>
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
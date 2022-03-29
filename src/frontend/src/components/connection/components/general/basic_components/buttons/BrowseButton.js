/*
 * Copyright (C) <2021>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import { BrowseButton as ToolboxBrowseButton } from "react-toolbox/lib/button";
import {formatHtmlId} from "@utils/app";
import styles from "@themes/default/general/basic_components.scss";
import ToolboxThemeInput from "../../../../hocs/ToolboxThemeInput";


/**
 * BrowseButton Component
 */
class BrowseButton extends Component{

    constructor(props){
        super(props);

        this.state = {
            focused: false,
        };
    }

    onFocus(){
        this.setState({focused: true});
    }

    onBlur(){
        this.setState({focused: false});
    }

    render(){
        const {focused} = this.state;
        const {name, tourStep, browseTitle, icon, label, themeStyle, hideInput, browseProps, onlyButton} = this.props;
        if(onlyButton){
            return(
                <ToolboxBrowseButton
                    {...browseProps}
                    className={styles.input_file_browse}
                    id={formatHtmlId(`button_${name ? name : label}`)}
                    onFocus={() => this.onFocus()}
                    onBlur={() => this.onBlur()}
                    disabled={hideInput}
                />
            );
        }
        return (
            <ToolboxThemeInput style={themeStyle} hideInput={hideInput} tourStep={tourStep} inputElementClassName={styles.input_file_label} inputElementText={browseTitle} icon={icon} label={label} isFocused={focused}>
                <ToolboxBrowseButton
                    {...browseProps}
                    className={styles.input_file_browse}
                    id={formatHtmlId(`button_${name ? name : label}`)}
                    onFocus={() => this.onFocus()}
                    onBlur={() => this.onBlur()}
                    disabled={hideInput}
                    ripple={false}
                />
            </ToolboxThemeInput>
        );
    }
}

BrowseButton.propTypes = {
    name: PropTypes.string,
    tourStep: PropTypes.string,
    browseTitle: PropTypes.string.isRequired,
    icon: PropTypes.string,
    label: PropTypes.string,
    browseProps: PropTypes.object.isRequired,
    hideInput: PropTypes.bool,
    onlyButton: PropTypes.bool,
};

BrowseButton.defaultProps = {
    themeStyle: {},
    hideInput: false,
    onlyButton: false,
};

export default BrowseButton;
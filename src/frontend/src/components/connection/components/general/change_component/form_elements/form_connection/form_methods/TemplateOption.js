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

import React from "react";
import styles from "@themes/default/general/basic_components";
import TemplateConversionIcon from "@components/general/app/TemplateConversionIcon";
import {connect} from "react-redux";

function mapStateToProps(state){
    const appVersion = state.applicationReducer.version;
    return{
        appVersion,
    };
}

@connect(mapStateToProps, {})
class TemplateOption extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const { innerProps, isDisabled, isSelected, appVersion,...props } = this.props;
        let invalidVersion = props.data.version !== appVersion;
        return !isDisabled
            ?
            (
                <div {...innerProps} onClick={invalidVersion ? null : innerProps.onClick} className={`${styles.select_option} ${isSelected || invalidVersion ? '' : styles.select_option_hover} ${isSelected ? styles.selected_option : ''}`}>
                    <span className={`${invalidVersion ? styles.option_invalid : ''}`}>{props.label}</span>
                    <TemplateConversionIcon data={props.data} classNameIcon={styles.convert}/>
                </div>
            )
            :
            null
    }
}

export default TemplateOption;
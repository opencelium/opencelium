/*
 * Copyright (C) <2022>  <becon GmbH>
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

import React from 'react';
import PropTypes from 'prop-types';
import styles from "@themes/default/content/connections/connection_overview_2";
import {BUSINESS_LABEL_MODE, COLOR_MODE} from "@classes/components/content/connection_overview_2/CSvg";
import RadioButtons from "@basic_components/inputs/RadioButtons";

class BusinessLabelMode extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {businessLabelMode, onChangeBusinessLabelMode} = this.props;
        return(
            <div className={styles.configurations_icon_business_label_mode}>
                <div className={styles.configurations_icon_title}>Business Label Mode:</div>
                <RadioButtons
                    label={''}
                    value={businessLabelMode}
                    handleChange={onChangeBusinessLabelMode}
                    radios={[
                        {
                            id: BUSINESS_LABEL_MODE.NOT_VISIBLE,
                            label: `Not Visible`,
                            value: BUSINESS_LABEL_MODE.NOT_VISIBLE,
                        },{
                            id: BUSINESS_LABEL_MODE.VISIBLE,
                            label: `Visible`,
                            value: BUSINESS_LABEL_MODE.VISIBLE,
                        },{
                            id: BUSINESS_LABEL_MODE.VISIBLE_ON_PRESS_KEY,
                            label: `Visible on Press Key (b)`,
                            value: BUSINESS_LABEL_MODE.VISIBLE_ON_PRESS_KEY,
                        }
                    ]}
                />
            </div>
        );
    }
}

BusinessLabelMode.propTypes = {
    businessLabelMode: PropTypes.oneOf(['NOT_VISIBLE', 'VISIBLE', 'VISIBLE_ON_PRESS_KEY']).isRequired,
    onChangeBusinessLabelMode: PropTypes.func.isRequired,
};

export default BusinessLabelMode;
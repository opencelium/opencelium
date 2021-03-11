/*
 * Copyright (C) <2020>  <becon GmbH>
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
import BusinessLayout from "@components/content/connection_overview_2/BusinessLayout";
import ProgramLayout from "@components/content/connection_overview_2/ProgramLayout";
import Details from "@components/content/connection_overview_2/Details";

import styles from "@themes/default/content/connections/connection_overview_2.scss";

/**
 * Layout for TemplateConverter
 */
class ConnectionLayout extends Component{

    constructor(props){
        super(props);
    }
    render(){
        return (
            <div className={styles.connection_editor}>
                <div className={styles.top_panel}>
                    <div className={`${styles.left_panel} ${styles.business_layout}`}>
                        <BusinessLayout/>
                    </div>
                    <div className={styles.grab_vertical}/>
                    <div className={styles.right_panel}>
                        <Details/>
                    </div>
                </div>
                <div className={styles.grab_horizontal}/>
                <div className={`${styles.bottom_panel} ${styles.program_layout}`}>
                    <ProgramLayout/>
                </div>
            </div>
        );
    }
}

export default ConnectionLayout;
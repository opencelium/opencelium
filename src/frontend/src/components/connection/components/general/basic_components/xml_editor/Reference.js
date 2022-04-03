

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

import React, {Component} from 'react';
import styles from "@themes/default/general/form_methods";
import ToolboxThemeInput from "../../../../hocs/ToolboxThemeInput";


/**
 * Reference component to display reference value
 */
class Reference extends Component{
    constructor(props) {
        super(props);
    }

    /**
     * to add reference
     */
    add(){
        const {ReferenceComponent} = this.props;
        ReferenceComponent.self.current.setIdValue();
        this.props.add();
    }

    render(){
        const {id, translate, ReferenceComponent} = this.props;
        return (
            <ToolboxThemeInput label={translate('XML_EDITOR.TAG.TYPE.REFERENCE_VALUE')} inputElementClassName={styles.multiselect_label}>
                <div style={{position: 'relative'}}>{ReferenceComponent.getComponent({submitEdit: () => this.add(), selectId: id})}</div>
            </ToolboxThemeInput>
        );
    }
}

export default Reference;
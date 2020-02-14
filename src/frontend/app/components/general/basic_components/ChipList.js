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
import PropTypes from 'prop-types';
import Chip from 'react-toolbox/lib/chip';


/**
 * ChipList Component
 */
class ChipList extends Component{

    constructor(props){
        super(props);
    }

    /**
     * to delete Chip from the List
     */
    deleteChip(value, key){
        const {entity, updateEntity, data} = this.props;
        entity[data.name].splice(key, 1);
        updateEntity(entity);
    }
    
    renderChipList(){
        const {entity, data, deletable} = this.props;
        let items = this.props.items ? this.props.items : entity[data.name];
        if(items.length === 0){
            return null;
        }
        return items.map((item, key) => {
            return <Chip key={key} deletable={deletable} onDeleteClick={(value) => ::this.deleteChip(value, key)}>{item}</Chip>;
        });
    }
    
    render(){
        return (
            <div>
                {this.renderChipList()}
            </div>
        );
    }
}


ChipList.propTypes = {
    entity: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
    deletable: PropTypes.bool,
};

export default ChipList;
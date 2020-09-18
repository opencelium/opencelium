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
import {connect} from 'react-redux';
import Select from 'react-select';
import {getThemeClass} from "@utils/app";

function mapStateToProps(state){
    const auth = state.get('auth');
    return{
        authUser: auth.get('authUser')
    };
}

/**
 * Select Component
 */
@connect(mapStateToProps, {})
class OCSelect extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {authUser, styles, ...props} = this.props;
        let {className} = this.props;
        let classNames = [
            'select',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <Select
                {...props}
                maxMenuHeight={200}
                minMenuHeight={50}
                className={className}
                styles={{
                    ...styles,
                    option: (provided) => ({
                        ...provided,
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                    }),
                    valueContainer:(styles, {data}) => {
                        return {
                            ...styles,
                            padding: '2px 0',
                        };
                    },
                    menu: (provided) => ({
                        ...provided,
                        zIndex: 100,
                        color: 'black'
                    })
                }}
            />
        );
    }
}

OCSelect.defaultProps = {
    className: '',
};

export default OCSelect;
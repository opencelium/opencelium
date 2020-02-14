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

import styles from '../../../../../../../../themes/default/general/enhancement.scss';


/**
 * Editor Component
 */
class Editor extends Component{

    constructor(props){
        super(props);

        this.isRemove = false;
    }

    /**
     * to select piece of code
     */
    selectPiece(pointer){
        if(!this.isRemove) {
            this.props.updateCodePointer(pointer);
        } else{
            this.isRemove = false;
        }
    }

    /**
     * to remove piece of code
     */
    removePiece(key){
        this.isRemove = true;
        this.props.removeCodePiece(key);
    }

    renderCode(){
        const {code, readOnly} = this.props;
        return code.code.map((piece, key) => {
            let pieceStyles = styles.item;
            switch(piece.type){
                case 'variable':
                    pieceStyles = styles.variable_item;
                    break;
                case 'constant':
                    pieceStyles = styles.constant_item;
                    break;
                case 'operator':
                    pieceStyles = styles.operator_item;
                    break;
            }
            if(key === code.pointer - 1 || key === 0 && code.pointer === 0){
                pieceStyles += ' ' + styles.editor_simple_code_piece_selected;
            }
            if(key === 0){
                return (
                    <div key={key} className={pieceStyles} onClick={() => ::this.selectPiece(key)}>
                        <div className={styles.editor_simple_code_piece_name}>{piece.name} =</div>
                    </div>
                );
            } else {
                return (
                    <div key={key} className={pieceStyles} onClick={() => ::this.selectPiece(key)}>
                        <div className={styles.editor_simple_code_piece_name}>{piece.name}</div>
                        {
                            readOnly
                            ?
                                null
                            :
                                <div className={styles.editor_simple_code_piece_x} onClick={() => ::this.removePiece(key)}>
                                    x
                                </div>
                        }
                    </div>
                );
            }
        });
    }
    
    render(){

        return (
            <div className={styles.editor}>
                {this.renderCode()}
            </div>
        );
    }
}

Editor.propTypes = {
    code: PropTypes.object.isRequired,
    resultVariable: PropTypes.object.isRequired,
    updateCodePointer: PropTypes.func.isRequired,
    removeCodePiece: PropTypes.func.isRequired,
    readOnly: PropTypes.bool,
};

Editor.defaultProps = {
    readOnly: false,
};

export default Editor;
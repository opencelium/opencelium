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
import { DraftailEditor, BLOCK_TYPE, INLINE_STYLE, ENTITY_TYPE } from "draftail";
import "draft-js/dist/Draft.css";
import "draftail/dist/draftail.css";

/**
 * Editor Component
 */
class OCEditor extends Component{

    constructor(props) {
        super(props);
    }

    render() {
        const {onFocus, onBlur, onSave, placeholder} = this.props;
        return (
            <DraftailEditor
                rawContentState={null}
                onFocus={onFocus}
                onBlur={onBlur}
                onSave={onSave}
                placeholder={placeholder}
                blockTypes={[
                    { type: BLOCK_TYPE.HEADER_THREE },
                    { type: BLOCK_TYPE.UNORDERED_LIST_ITEM },
                    { type: BLOCK_TYPE.ORDERED_LIST_ITEM },
                    { type: BLOCK_TYPE.BLOCKQUOTE, style: {
                        borderLeft: '3px solid #e5e5e5',
                        padding: '0 0 0 20px',
                        marginLeft: 0,
                        fontStyle: 'italic'
                        }},
                    { type: BLOCK_TYPE.CODE },
                ]}
                inlineStyles={[
                    { type: INLINE_STYLE.BOLD, style: {background: 'red'} },
                    { type: INLINE_STYLE.ITALIC },
                    { type: INLINE_STYLE.STRIKETHROUGH },
                    { type: INLINE_STYLE.UNDERLINE },
                    { type: INLINE_STYLE.QUOTATION },
                ]}
                entityTypes={[
                ]}
            />
        );
    }
}

export default OCEditor;
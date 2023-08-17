import Button  from '@app_component/base/button/Button';
import React, {FC, useState} from 'react';
import {ColorTheme} from "@style/Theme";
import {TextSize} from "@app_component/base/text/interfaces";

interface PointerProps{
    pointer: string,
    pointers: string[],
    submitEdit: any,
}

const Pointer: FC<PointerProps> = ({pointer, pointers, submitEdit}) => {
    const [showIcon, toggleIcon] = useState<boolean>(false);
    let pointerSplit = pointer.split('.');
    const remove = () => {
        const filteredPointers = pointers.filter(p => p !== pointer).join(';');
        submitEdit(filteredPointers)
    }
    return (
        <div
            onMouseOver={() => {if(!showIcon) toggleIcon(!showIcon)}}
            onMouseLeave={() => {if(showIcon) toggleIcon(!showIcon)}}
            title={pointerSplit.slice(2, pointerSplit.length).join('.').replace('[]', '')}
            style={{position: 'relative', float: 'left', margin: '7px 2px', width: '20px', height: '10px', background: pointerSplit[0]}}
        >
            {showIcon && <div style={{position: "absolute", right: '-5px', top: '-12px'}}>
                <Button background={ColorTheme.Black} handleClick={remove} hasBackground={false} icon={'delete'} iconSize={TextSize.Size_12}/>
            </div>}
        </div>
    )
}


export default Pointer;


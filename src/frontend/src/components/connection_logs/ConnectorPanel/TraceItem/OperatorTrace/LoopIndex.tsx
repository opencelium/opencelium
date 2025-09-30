import React, {useEffect, useState} from 'react';
import {ColorTheme} from "@style/Theme";
import InputText from "@app_component/base/input/text/InputText";
import {onEnter} from "@application/utils/utils";

interface LoopIteratorProps {
    iterationIndex: number,
    size: number,
    hasError: boolean,
    loopIndex: string,
    loadByIndex: (newIndex: number) => void,
}
const FixWidth = 50;
const LoopIndex = ({iterationIndex, loopIndex, hasError, size, loadByIndex}: LoopIteratorProps) => {
    const [isMouseOver, setMouseOver] = useState<boolean>(false);
    const [hasFocus, setFocus] = useState<boolean>(false);
    const [newLoopIndex, setNewLoopIndex] = useState<string>(`${iterationIndex}`);
    const [width, setWidth] = useState<number>(10);
    useEffect(() => {
        if (isMouseOver) {
            if (width !== FixWidth) {
                setWidth(FixWidth);
            }
        } else {
            if (!hasFocus) {
                if (width === FixWidth) {
                    setWidth(newLoopIndex.length > 0 ? newLoopIndex.length * 10 : 10);
                }
            }
        }
    }, [isMouseOver]);
    useEffect(() => {
        if (!hasFocus) {
            if (width === FixWidth) {
                setWidth(newLoopIndex.length > 0 ? newLoopIndex.length * 10 : 10);
                loadByIndex(+newLoopIndex - 1);
            }
        }
    }, [hasFocus]);
    useEffect(() => {
        if (newLoopIndex !== `${iterationIndex}`){
            setNewLoopIndex(`${iterationIndex}`)
        }
    }, [iterationIndex])
    const handleChange = (newValue: string) => {
        // allow empty string for editing
        if (newValue === "") {
            setNewLoopIndex("1");
            return;
        }
        if (!/^\d+$/.test(newValue)) return;
        let num = parseInt(newValue, 10);
        if (num < 1) num = 1;
        if (num > size) num = size;
        const newLoopIndex = num.toString()
        setNewLoopIndex(newLoopIndex);
    };
    return (
        <span title={'Press Enter'} style={{display: 'flex', gap: '2px'}} onMouseOver={() => setMouseOver(true)} onMouseLeave={() => setMouseOver(false)}>
            <InputText
                onFocus={() => setFocus(true)}
                onBlur={() => setFocus(false)}
                marginLeft={'0'}
                inputHeight={'18px'}
                value={`${newLoopIndex}`}
                min={1}
                style={{color: iterationIndex + 1 === size && hasError ? ColorTheme.Red : '#000', textAlign: 'center'}}
                max={size}
                onChange={(e) => handleChange(e.target.value)}
                minHeight={'1'}
                width={`${width}px`}
                onKeyDown={(e) => onEnter(e, () => {loadByIndex(+newLoopIndex - 1)})}
                hasUnderline={false}
            />
            <span>{`/`}</span>
            <span style={{color: hasError && loopIndex === `${(+size - 1)}` ? ColorTheme.Red : '#000'}}>
                {size || '...'}
            </span>
        </span>
    )
}

export default LoopIndex;

import Button from '@app_component/base/button/Button';
import { TextSize } from "@app_component/base/text/interfaces";
import { replaceVariables } from "@application/utils/utils";
import CConnection from "@classes/content/connection/CConnection";
import CEnhancement from "@classes/content/connection/field_binding/CEnhancement";
import Confirmation from "@entity/connection/components/components/general/app/Confirmation";
import { ColorTheme } from "@style/Theme";
import React, { FC, useState } from 'react';

interface PointerProps{
    pointer: string,
    pointers: string[],
    submitEdit: any,
    onClick: any,
    connection: CConnection,
}

const Pointer: FC<PointerProps> = ({connection, pointer, pointers, submitEdit, onClick}) => {
    const [showIcon, toggleIcon] = useState<boolean>(false);
    const [isConfirmationShown, toggleConfirmation] = useState<boolean>(false);
    let pointerSplit = pointer.split('.');
    const remove = () => {
        onClick();
        let filteredIndex = -1;
        const filteredPointers = pointers.filter((p, index) => {
            if(p === pointer){
                filteredIndex = index;
            }
            return p !== pointer;
        }).join(';');
        let updatedEnhancement = connection.getEnhancementByTo() || null;
        if(filteredIndex !== -1 && updatedEnhancement){
            for(let i = filteredIndex; i < pointers.length; i++){
                if(i === filteredIndex){
                    updatedEnhancement.expertCode = replaceVariables(updatedEnhancement.expertCode, {[`VAR_${i}`]: CEnhancement.generateNotExistVar()});
                } else{
                    updatedEnhancement.expertCode = replaceVariables(updatedEnhancement.expertCode, {[`VAR_${i}`]: `VAR_${i - 1}`});
                }
            }
            connection.updateEnhancement(updatedEnhancement);
        }
        submitEdit(filteredPointers);
        toggleConfirmation(false);
    }
    const apiResponseType = pointerSplit[2];
    const rawTitleString = pointerSplit.slice(3, pointerSplit.length).join('.').replace('[]', '');
    const titleString = rawTitleString.replace(/^\$\./, '').replace(/^\$/, '');
    const title = apiResponseType === 'status' ? 'status' : `${apiResponseType}.$.${titleString}`;
    return (
        <div
            onMouseOver={() => {if(!showIcon) toggleIcon(!showIcon)}}
            onMouseLeave={() => {if(showIcon) toggleIcon(!showIcon)}}
            title={title}
            style={{position: 'relative', float: 'left', margin: '7px 2px', width: '20px', height: '10px', background: pointerSplit[0]}}
        >
            {showIcon && <div style={{position: "absolute", right: '-5px', top: '-12px'}}>
                <Button background={ColorTheme.Black} handleClick={() => toggleConfirmation(true)} hasBackground={false} icon={'delete'} iconSize={TextSize.Size_12}/>
            </div>}
            <Confirmation
                okClick={remove}
                cancelClick={() => toggleConfirmation(false)}
                active={isConfirmationShown}
                title={'Confirmation'}
                message={'Do you really want to delete?'}
            />
        </div>
    )
}


export default Pointer;


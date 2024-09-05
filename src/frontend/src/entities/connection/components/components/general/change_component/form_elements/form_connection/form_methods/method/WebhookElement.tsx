import Button  from '@app_component/base/button/Button';
import React, {FC, useState} from 'react';
import {ColorTheme} from "@style/Theme";
import {TextSize} from "@app_component/base/text/interfaces";
import Confirmation from "@entity/connection/components/components/general/app/Confirmation";
import CConnection from "@classes/content/connection/CConnection";
import Webhook from "@root/classes/Webhook";

interface WebhookElementProps{
    webhook: Webhook,
    submitEdit: any,
    onClick: any,
    connection: CConnection,
}

const WebhookElement: FC<WebhookElementProps> = ({connection, webhook, submitEdit}) => {
    const [showIcon, toggleIcon] = useState<boolean>(false);
    const [isConfirmationShown, toggleConfirmation] = useState<boolean>(false);
    const remove = () => {
        submitEdit('');
        toggleConfirmation(false);
    }
    return (
        <div
            onMouseOver={() => {
                if (!showIcon) toggleIcon(!showIcon)
            }}
            onMouseLeave={() => {
                if (showIcon) toggleIcon(!showIcon)
            }}
            title={webhook.label}
            style={{
                position: 'relative',
                float: 'left',
                margin: '7px 2px',
                height: '10px',
                background: '#eee',
                marginTop: 0
            }}
        >
            <span style={{padding: '2px 5px', borderRadius: 3, color: '#000', background: '#eee'}}
                  title={webhook.label}>{webhook.name}</span>
            {showIcon && <div style={{position: "absolute", right: '-5px', top: '-12px'}}>
                <Button background={ColorTheme.Black} handleClick={() => toggleConfirmation(true)} hasBackground={false}
                        icon={'delete'} iconSize={TextSize.Size_12}/>
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


export default WebhookElement;


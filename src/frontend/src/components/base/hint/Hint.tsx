import React from 'react';
import DefaultText from "@app_component/base/text/DefaultText";

const Hint = ({message, style}: {message: any, style?: any}) => {
    return (
        <div style={style || {}}>
            <DefaultText value={`Hint: `} isBold/>
            <DefaultText value={message}/>
        </div>
    )
}

export default Hint;

import React from 'react';

const Hint = ({message, style}: {message: any, style?: any}) => {
    return (
        <div style={style || {}}>
            <b>{`Hint: `}</b>
            <span>{message}</span>
        </div>
    )
}

export default Hint;

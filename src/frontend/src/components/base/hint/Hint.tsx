import React from 'react';

const Hint = ({message}: {message: any}) => {
    return (
        <div>
            <b>{`Hint: `}</b>
            <span>{message}</span>
        </div>
    )
}

export default Hint;

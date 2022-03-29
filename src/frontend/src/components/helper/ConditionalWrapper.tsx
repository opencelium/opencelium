import React, {FC} from 'react';


interface ConditionalWrapperProps{
    condition: boolean,
    wrapper: (children: any) => any,
    children: any,
}

const ConditionalWrapper: FC<ConditionalWrapperProps> = ({ condition, wrapper, children }) => {
    return condition ? wrapper(children) : children;
};

export default ConditionalWrapper;
import React from "react";

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement>{
    isLoading?: boolean,
    loadingSize?: number | string,
}

export {
    ImageProps,
}
interface ReactCropProps{
    src: any,
    setImage: (image: any) => void,
}

interface CropProps{
    unit: string,
    width: number,
    height?: number,
    aspect: number,
}

export {
    ReactCropProps,
    CropProps,
}
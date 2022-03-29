import React, {FC, useEffect, useState} from 'react';
import {withTheme} from 'styled-components';
import {ImageProps} from './interfaces';
import {ImageStyled, UploadButtonStyled} from './styles';
import {Dialog} from "@atom/dialog/Dialog";
import InputFile from "@atom/input/file/InputFile";
import {API_REQUEST_STATE} from "@interface/application/IApplication";
import Button from "@atom/button/Button";
import {checkImage} from "@utils/app";
import DefaultConnectorImagePath from "@images/default_connector.png";

const Image: FC<ImageProps> =
    ({
        src,
        alt,
        uploadImage,
        uploadingImage,
        hasUpload,
        className,
    }) => {
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [isCorrectImage, setIsCorrectImage] = useState<boolean>(false);
    const [validationMessage, setValidationMessage] = useState<string>('');
    const [showDialog, toggleDialog] = useState<boolean>(false);
    const [hasUploadButton, toggleUploadButton] = useState<boolean>(false);
    const [img, setImg] = useState(null);
    const isLoading = uploadingImage === API_REQUEST_STATE.START;
    const isDisabled = isLoading;
    const selectImage = (image: any) => {
        setImg(image);
        setValidationMessage('');
    }
    const toggle = () => {
        hideUploadButton();
        setImg(null);
        if(!isLoading){
            toggleDialog(!showDialog);
        }
    }
    const showUploadButton = () => {
        toggleUploadButton(true);
    }
    const hideUploadButton = () => {
        toggleUploadButton(false);
    }
    const upload = () => {
        if(img === null){
            setValidationMessage('Image is a required field');
            return;
        }
        uploadImage(img);
        toggle();
    }
    useEffect(() => {
        setIsCorrectImage(false);
        setIsRefreshing(true);
        checkImage(src,() => {setIsCorrectImage(true); setTimeout(() => {setIsRefreshing(false)}, 300)}, () => setIsCorrectImage(false));
    }, [src])
    return (
        <React.Fragment>
            <ImageStyled className={className} onMouseOver={showUploadButton} onMouseLeave={hideUploadButton} isRefreshing={isRefreshing}>
                <img src={isCorrectImage ? src : DefaultConnectorImagePath} alt={alt}/>
                {hasUploadButton && hasUpload && <UploadButtonStyled><div><Button icon={'upload'} hasBackground={false} handleClick={toggle}/></div></UploadButtonStyled>}
            </ImageStyled>
            <Dialog
                actions={[
                    {label: 'Upload', onClick: upload, id: 'upload', isLoading: isLoading, isDisabled: isDisabled},
                    {label: 'Cancel', onClick: toggle, id: 'cancel', isDisabled: isDisabled}
                ]}
                active={showDialog}
                toggle={toggle}
                title={'Upload Icon'}
            >
                <InputFile
                    id={`input_upload`}
                    icon={'photo'}
                    error={validationMessage}
                    onChange={(file) => selectImage([file])}
                    value={img}
                    label={'image'}
                    accept={'image/png, image/jpeg'}
                    hasNoImage={false}
                />
            </Dialog>
        </React.Fragment>
    )
}

Image.defaultProps = {
    hasUpload: false,
    className: '',
}


export {
    Image,
};

export default withTheme(Image);
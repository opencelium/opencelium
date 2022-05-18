/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {FC, useEffect, useState} from 'react';
import {withTheme} from 'styled-components';
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {checkImage} from "@application/utils/utils";
import Dialog from "@app_component/base/dialog/Dialog";
import InputFile from "@app_component/base/input/file/InputFile";
import Button from "@app_component/base/button/Button";
import DefaultConnectorImagePath from "@image/application/default_image.png";
import {ImageProps} from './interfaces';
import {ImageStyled, UploadButtonStyled} from './styles';

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
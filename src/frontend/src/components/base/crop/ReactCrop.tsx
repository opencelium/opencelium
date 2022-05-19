/*
 *  Copyright (C) <2022>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {FC, useEffect, useState} from 'react';
import ReactImageCrop, {Crop} from 'react-image-crop';
import {dataURLtoFile} from "@application/utils/utils";
import {PreviewImageStyled} from "./styles";
import {ReactCropProps} from "./interfaces";


const ReactCrop: FC<ReactCropProps> = ({
        src,
        setImage,
    }) => {
    let initialImageRef: any = null;
    const [imageRef, setImageRef] = useState(null);
    const [croppedImageUrl, setCroppedImageUrl] = useState<string>('');
    const [crop, setCrop] = useState<Partial<Crop>>({
        width: 30,
        unit: '%',
        aspect: 1
    });

    useEffect(() => {
        if(src === null && croppedImageUrl !== ''){
            setCroppedImageUrl('');
        }
    }, [src]);

    const onImageLoaded = (image: any) => {
        setImageRef(image);
        initialImageRef = image;
    };

    const onCropComplete = (crop: Crop) =>  {
        makeClientCrop(crop);
    };

    const onCropChange = (crop: Crop) => {
        setCrop(crop);
    };

    const makeClientCrop = async (crop: Partial<Crop>) => {
        let imgRef = imageRef || initialImageRef;
        if (imgRef && crop.width && crop.height) {
            const croppedImageUrl: any = await getCroppedImg(
                imgRef,
                crop,
                'newFile.jpeg'
            );
            setCroppedImageUrl(croppedImageUrl);
        }
    }

    const getCroppedImg = (image: any, crop: Partial<Crop>, fileName: string) => {
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            crop.width,
            crop.height
        );

        const reader = new FileReader()

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob: Blob) => {
                if (!blob) {
                    console.error('Canvas is empty');
                    return;
                }
                reader.readAsDataURL(blob)
                reader.onloadend = () => {
                    const fileImage = dataURLtoFile(reader.result, 'cropped.jpg');
                    setImage(fileImage);
                }
                // @ts-ignore
                blob.name = fileName;
                // @ts-ignore
                let fileUrl = this?.fileUrl || null;
                window.URL.revokeObjectURL(fileUrl);
                fileUrl = window.URL.createObjectURL(blob);
                resolve(fileUrl);
            }, 'image/jpeg');
        });
    }
    return(
        <React.Fragment>
            {src && (
                <ReactImageCrop
                    style={{marginTop: '10px'}}
                    src={src}
                    crop={crop}
                    ruleOfThirds
                    onImageLoaded={onImageLoaded}
                    onComplete={onCropComplete}
                    onChange={onCropChange}
                />
            )}
            {croppedImageUrl && (
                <PreviewImageStyled alt="Crop" style={{ maxWidth: '100%' }} src={croppedImageUrl} />
            )}
        </React.Fragment>
    );
}


export default ReactCrop;
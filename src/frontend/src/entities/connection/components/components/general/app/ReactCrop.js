/*
 *  Copyright (C) <2023>  <becon GmbH>
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

import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import ReactImageCrop from 'react-image-crop';
import styles from "@entity/connection/components/themes/default/general/app.scss";
import {dataURLtoFile} from "@application/utils/utils";


function mapStateToProps(state) {
    const authUser = state.authReducer.authUser;
    return {
        authUser,
    };
}

@connect(mapStateToProps, {})
class ReactCrop extends React.Component{

    constructor(props) {
        super(props);
        this.state = {
            croppedImage: null,
            croppedImageUrl: '',
            crop: {
                unit: '%',
                width: 30,
                aspect: 1,
            },
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(this.props.src === null && this.state.croppedImageUrl !== ''){
            this.setState({
                croppedImageUrl: '',
            });
        }
    }

    onImageLoaded(image){
        this.imageRef = image;
    };

    onCropComplete(crop) {
        this.makeClientCrop(crop);
    };

    onCropChange(crop){
        this.setState({ crop });
    };

    async makeClientCrop(crop) {
        if (this.imageRef && crop.width && crop.height) {
            const croppedImageUrl = await this.getCroppedImg(
                this.imageRef,
                crop,
                'newFile.jpeg'
            );
            this.setState({ croppedImageUrl });
        }
    }

    getCroppedImg(image, crop, fileName) {
        const {setCroppedImage} = this.props;
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
            canvas.toBlob(blob => {
                if (!blob) {
                    console.error('Canvas is empty');
                    return;
                }
                reader.readAsDataURL(blob)
                reader.onloadend = () => {
                    const fileImage = dataURLtoFile(reader.result, 'cropped.jpg');
                    setCroppedImage(fileImage);
                }
                blob.name = fileName;
                window.URL.revokeObjectURL(this.fileUrl);
                this.fileUrl = window.URL.createObjectURL(blob);
                resolve(this.fileUrl);
            }, 'image/jpeg');
        });
    }

    render(){
        const {src, className} = this.props;
        const { crop, croppedImageUrl} = this.state;
        return(
            <React.Fragment>
                {src && (
                    <ReactImageCrop
                        className={className}
                        src={src}
                        crop={crop}
                        ruleOfThirds
                        onImageLoaded={(a) => this.onImageLoaded(a)}
                        onComplete={(a) => this.onCropComplete(a)}
                        onChange={(a) => this.onCropChange(a)}
                    />
                )}
                {croppedImageUrl && (
                    <img className={styles.image_crop_preview} alt="Crop" style={{ maxWidth: '100%' }} src={croppedImageUrl} />
                )}
            </React.Fragment>
        );
    }
}

ReactCrop.propTypes = {
    src: PropTypes.any,
    setCroppedImage: PropTypes.func.isRequired,
};

ReactCrop.defaultProps = {
    className: '',
}


export default ReactCrop;
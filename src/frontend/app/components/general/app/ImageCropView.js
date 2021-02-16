import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import ReactCrop from 'react-image-crop';
import styles from "@themes/default/general/change_component";
import Dialog from "@basic_components/Dialog";
import CardIcon from "@components/icons/CardIcon";
import {dataURLtoFile} from "@utils/app";



function mapStateToProps(state) {
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}

@connect(mapStateToProps, {})
class ImageCropView extends React.Component{

    constructor(props) {
        super(props);
        this.state = {
            isDialogVisible: false,
            isMouseOverImage: false,
            src: null,
            croppedImage: null,
            croppedImageUrl: '',
            crop: {
                unit: '%',
                width: 30,
                aspect: 1,
            },
        }
    }

    onMouseOverImage(){
        this.setState({
            isMouseOverImage: true,
        });
    }

    onMouseLeaveImage(){
        this.setState({
            isMouseOverImage: false,
        });
    }

    toggleShowDialog(){
        this.setState({
            isDialogVisible: !this.state.isDialogVisible,
            src: null,
            croppedImageUrl: '',
        })
    }

    uploadIcon(){
        const {croppedImage} = this.state;
        const {uploadIcon, mapping, entityId} = this.props;
        uploadIcon(mapping({entityId, croppedImage}));
        this.toggleShowDialog();
    }

    onSelectFile(e){
        if (e.target.files && e.target.files.length > 0) {
            const reader = new FileReader();
            reader.addEventListener('load', () =>
                this.setState({ src: reader.result })
            );
            reader.readAsDataURL(e.target.files[0]);
            this.setState({
                imageFile: e.target.files[0],
            })
        }
    };

    onImageLoaded(image){
        this.imageRef = image;
    };

    onCropComplete(crop) {
        ::this.makeClientCrop(crop);
    };

    onCropChange = (crop, percentCrop) => {
        // You could also use percentCrop:
        // this.setState({ crop: percentCrop });
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
                    this.setState({
                        croppedImage: fileImage,
                    });
                }
                blob.name = fileName;
                window.URL.revokeObjectURL(this.fileUrl);
                this.fileUrl = window.URL.createObjectURL(blob);
                resolve(this.fileUrl);
            }, 'image/jpeg');
        });
    }

    renderDialog(){
        const { crop, croppedImageUrl, src, isDialogVisible } = this.state;
        return(
            <Dialog
                actions={[{label: 'Upload', onClick: ::this.uploadIcon, id: 'dialog_upload'}, {label: 'Cancel', onClick: ::this.toggleShowDialog, id: 'dialog_close'}]}
                active={isDialogVisible}
                toggle={::this.toggleShowDialog}
                title={'Upload Image'}
                theme={{dialog: styles.request_icon_dialog}}
            >
                <div>
                    <input type="file" accept="image/*" onChange={::this.onSelectFile} />
                </div>
                {src && (
                    <ReactCrop
                        src={src}
                        crop={crop}
                        ruleOfThirds
                        onImageLoaded={::this.onImageLoaded}
                        onComplete={::this.onCropComplete}
                        onChange={::this.onCropChange}
                    />
                )}
                {croppedImageUrl && (
                    <img alt="Crop" style={{ maxWidth: '100%' }} src={croppedImageUrl} />
                )}
            </Dialog>
        )
    }

    render(){
        const {icon, title, authUser} = this.props;
        return(
            <div>
                <CardIcon authUser={authUser} title={title} icon={icon} onClick={::this.toggleShowDialog} onMouseOverImage={::this.onMouseOverImage} onMouseLeaveImage={::this.onMouseLeaveImage}/>
                {::this.renderDialog()}
            </div>
        );
    }
}


ImageCropView.propTypes = {
    entityId: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    uploadIcon: PropTypes.func.isRequired,
    uploadingIcon: PropTypes.number.isRequired,
    mapping: PropTypes.func.isRequired,
}

ImageCropView.defaultProps = {

}

export default ImageCropView;
import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import ReactCrop from 'react-image-crop';
import styles from "@themes/default/general/app.scss";
import Dialog from "@basic_components/Dialog";
import CardIcon from "@components/icons/CardIcon";
import {dataURLtoFile} from "@utils/app";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import BrowseButton from "@basic_components/buttons/BrowseButton";



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
            browseTitle: 'Please, select an image...',
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
            browseTitle: 'Please, select an image...',
        })
    }

    uploadIcon(){
        const {croppedImage} = this.state;
        const {uploadIcon, mapping, entityId} = this.props;
        uploadIcon(mapping({entityId, croppedImage}));
        this.toggleShowDialog();
    }

    onSelectFile(e){
        const f = e.target.files[0];
        if (f) {
            const reader = new FileReader();
            reader.addEventListener('load', () =>
                this.setState({ src: reader.result })
            );
            reader.readAsDataURL(f);
            this.setState({
                imageFile: f,
                browseTitle: f.name,
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
        const { crop, croppedImageUrl, src, isDialogVisible, browseTitle } = this.state;
        return(
            <Dialog
                actions={[{label: 'Upload', onClick: ::this.uploadIcon, id: 'dialog_upload'}, {label: 'Cancel', onClick: ::this.toggleShowDialog, id: 'dialog_close'}]}
                active={isDialogVisible}
                toggle={::this.toggleShowDialog}
                title={'Upload Image'}
                theme={{dialog: styles.icon_dialog}}
            >
                <BrowseButton
                    label={'Image'}
                    icon={'attach_file'}
                    browseTitle={browseTitle}
                    browseProps={{
                        icon: "file_upload",
                        label: "Select",
                        onChange: ::this.onSelectFile,
                        accept: "image/*",
                        className: styles.input_file_browse,
                    }}
                />
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
        const {isMouseOverImage} = this.state;
        const {icon, title, authUser} = this.props;
        let cardIconStyles = {opacity: 1};
        if(isMouseOverImage){
            cardIconStyles.opacity = 0.5;
        }
        return(
            <div>
                <div className={styles.image_crop} onMouseOver={::this.onMouseOverImage} onMouseLeave={::this.onMouseLeaveImage}>
                    <CardIcon authUser={authUser} title={title} icon={icon} onClick={::this.toggleShowDialog} style={cardIconStyles}/>
                    {isMouseOverImage && <TooltipFontIcon onClick={::this.toggleShowDialog} className={styles.upload_icon} tooltip={'Upload'} value={'upload'}/>}
                </div>
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
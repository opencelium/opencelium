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

import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import styles from "@themes/default/general/app.scss";
import Dialog from "@basic_components/Dialog";
import CardIcon from "@components/icons/CardIcon";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import BrowseButton from "@basic_components/buttons/BrowseButton";
import ReactCrop from "@components/general/app/ReactCrop";



function mapStateToProps(state) {
    const authUser = state.authReducer.authUser;
    return {
        authUser,
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
        }
    }

    hasUpload(){
        return typeof this.props.uploadIcon === 'function';
    }

    setCroppedImage(croppedImage){
        this.setState({croppedImage});
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
        if(this.hasUpload()){
            this.setState({
                isDialogVisible: !this.state.isDialogVisible,
                src: null,
                browseTitle: 'Please, select an image...',
            })
        }
    }

    uploadIcon(){
        const {croppedImage} = this.state;
        const {uploadIcon, mapping, entityId, title} = this.props;
        uploadIcon(mapping({entityId, title, croppedImage}));
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
                browseTitle: f.name,
            })
        }
    };


    renderDialog(){
        const {src, isDialogVisible, browseTitle } = this.state;
        return(
            <Dialog
                actions={[{label: 'Upload', onClick: () => this.uploadIcon(), id: 'dialog_upload'}, {label: 'Cancel', onClick: () => this.toggleShowDialog(), id: 'dialog_close'}]}
                active={isDialogVisible}
                toggle={() => this.toggleShowDialog()}
                title={'Upload Icon'}
                theme={{dialog: styles.icon_dialog}}
            >
                <div style={{position: 'relative'}}>
                    <BrowseButton
                        label={'Icon'}
                        icon={'photo'}
                        browseTitle={browseTitle}
                        browseProps={{
                            icon: "file_upload",
                            label: "Select",
                            onChange: (a) => this.onSelectFile(a),
                            accept: "image/*",
                        }}
                    />
                    <ReactCrop src={src} setCroppedImage={(a) => this.setCroppedImage(a)}/>
                </div>
            </Dialog>
        )
    }

    render(){
        const {isMouseOverImage} = this.state;
        const {icon, title, authUser} = this.props;
        let cardIconStyles = {opacity: 1};
        const showUploadIcon = isMouseOverImage && this.hasUpload();
        if(showUploadIcon){
            cardIconStyles.opacity = 0.5;
        }
        return(
            <div style={{width: 'calc(30% - 0.5vw)'}}>
                <div className={styles.image_crop} onMouseOver={() => this.onMouseOverImage()} onMouseLeave={() => this.onMouseLeaveImage()}>
                    <CardIcon authUser={authUser} title={title} icon={icon} onClick={() => this.toggleShowDialog()} style={cardIconStyles}/>
                    {showUploadIcon && <TooltipFontIcon onClick={() => this.toggleShowDialog()} wrapClassName={styles.upload_icon} size={'1.5vw'} tooltip={'Upload'} value={'upload'}/>}
                </div>
                {this.renderDialog()}
            </div>
        );
    }
}


ImageCropView.propTypes = {
    entityId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    uploadIcon: PropTypes.func,
    uploadingIcon: PropTypes.number,
    mapping: PropTypes.func,
}

ImageCropView.defaultProps = {

}

export default ImageCropView;
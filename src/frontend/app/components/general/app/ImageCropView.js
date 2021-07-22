/*
 * Copyright (C) <2021>  <becon GmbH>
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
        }
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
        this.setState({
            isDialogVisible: !this.state.isDialogVisible,
            src: null,
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
                browseTitle: f.name,
            })
        }
    };


    renderDialog(){
        const {src, isDialogVisible, browseTitle } = this.state;
        return(
            <Dialog
                actions={[{label: 'Upload', onClick: ::this.uploadIcon, id: 'dialog_upload'}, {label: 'Cancel', onClick: ::this.toggleShowDialog, id: 'dialog_close'}]}
                active={isDialogVisible}
                toggle={::this.toggleShowDialog}
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
                            onChange: ::this.onSelectFile,
                            accept: "image/*",
                        }}
                    />
                    <ReactCrop src={src} setCroppedImage={::this.setCroppedImage}/>
                </div>
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
                    {isMouseOverImage && <TooltipFontIcon onClick={::this.toggleShowDialog} className={styles.upload_icon} size={'2vw'} tooltip={'Upload'} value={'upload'}/>}
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
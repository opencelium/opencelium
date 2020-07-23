import React from 'react';
import XmlEditor from "@basic_components/xml_editor/XmlEditor";
import styles from "@themes/default/general/form_methods";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";

class XmlBody extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            isBodyEditOpened: false,
        };
    }

    openBodyEdit(){
        this.setState({isBodyEditOpened: true});
    }

    closeBodyEdit(){
        this.setState({isBodyEditOpened: false});
    }

    renderPlaceholder(){
        const {method} = this.props;
        let hasError = false;
        if(method && method.error && method.error.hasError){
            if(method.error.location === 'body'){
                hasError = true;
            }
        }
        return(
            <React.Fragment>
                <span className={styles.method_body_placeholder}
                      title={'more details'}
                      style={hasError ? {color: 'red'} : {}}
                      onClick={::this.openBodyEdit}>{`<?xml ... ?>`}</span>
            </React.Fragment>
        );
    }

    renderCloseMenuEditButton(){
        return (
            <TooltipFontIcon
                className={styles.xml_body_close_menu_edit}
                value={'check_circle_outline'}
                tooltip={'Apply'}
                onClick={::this.closeBodyEdit}
            />
        );
    }

    render(){
        const {isBodyEditOpened} = this.state;
        const {method, updateBody, readOnly} = this.props;
        if(!isBodyEditOpened){
            return this.renderPlaceholder();
        }
        return(
            <div className={styles.method_body_xml}>
                {::this.renderCloseMenuEditButton()}
                <XmlEditor xml={method.request.body} afterUpdateCallback={updateBody} readOnly={readOnly}/>
            </div>
        );
    }
}

XmlBody.defaultProps = {
    readOnly: false,
};

export default XmlBody;
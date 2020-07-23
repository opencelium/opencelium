import React from 'react';
import PropTypes from 'prop-types';
import Tag from "@basic_components/xml_editor/Tag";
import CXmlEditor from "@classes/components/general/basic_components/CXmlEditor";
import styles from '@themes/default/general/basic_components.scss';

class XmlEditor extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            xml: CXmlEditor.createXmlEditor(props.xml),
        };
    }

    updateXml(){
        const {xml} = this.state;
        const {afterUpdateCallback} = this.props;
        this.setState({xml});
        if(afterUpdateCallback){
            afterUpdateCallback(xml.convertToXml());
        }
    }

    deleteCoreTag(){
        const {xml} = this.state;
        xml.removeCoreTag();
        this.updateXml();
    }

    deleteDeclaration(){
        const {xml} = this.state;
        xml.removeDeclaration();
        this.updateXml();
    }

    render() {
        const {className, readOnly} = this.props;
        const {xml} = this.state;
        return(
            <div className={`${styles.xml_editor} ${className}`}>
                {xml && xml.declaration && <Tag tag={xml.declaration} isDeclaration update={::this.updateXml} deleteTag={::this.deleteDeclaration} readOnly={readOnly}/>}
                {xml && xml.tag && <Tag tag={xml.tag} update={::this.updateXml} deleteTag={::this.deleteCoreTag} readOnly={readOnly}/>}
            </div>
        );
    }
}

XmlEditor.propTypes = {
    xml: PropTypes.string.isRequired,
    afterUpdateCallback: PropTypes.func,
    className: PropTypes.string,
    readOnly: PropTypes.bool,
};

XmlEditor.defaultProps = {
    className: '',
    readOnly: false,
};

export default XmlEditor;
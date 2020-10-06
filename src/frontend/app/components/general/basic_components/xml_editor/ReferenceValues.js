import React, {Component} from 'react';
import PropTypes from 'prop-types';
import appStyles from '@themes/default/general/basic_components.scss';
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";


/**
 * ReferenceValues component to display line of references
 */
class ReferenceValues extends Component{

    /**
     * to delete reference by index
     * @param index - of the reference
     */
    deleteReference(index){
        const {references} = this.props;
        let pointers = references.split(';');
        if(index >= 0 && index < pointers.length) {
            pointers.splice(index, 1);
            this.props.updateReferences(pointers.join(';'));
        }
    }

    render() {
        const {translate, references, maxVisible, hasDelete} = this.props;
        let {styles} = this.props;
        if(typeof references === 'string') {
            let pointers = references.split(';');
            if (pointers.length > 0) {
                return pointers.map((p, key) => {
                    let extraStyles = {};
                    let pointer = p.split('.');
                    if (pointer.length > 3) {
                        if(key < maxVisible) {
                            if(key === 0){
                                extraStyles.marginLeft = 0;
                            }
                            return (
                                <React.Fragment key={key}>
                                    <TooltipFontIcon
                                        className={appStyles.reference_value}
                                        tooltip={pointer.slice(2, pointer.length).join('.').replace('[]', '')}
                                        value={<span/>}
                                        style={{background: pointer[0], ...styles, ...extraStyles}}
                                    />
                                    {hasDelete && <TooltipFontIcon tooltip={translate('XML_EDITOR.DELETE_ICON')} onClick={() => ::this.deleteReference(key)} value={'delete'} className={appStyles.reference_value_delete}/>}
                                </React.Fragment>
                            );
                        } else{
                            if(key === maxVisible) {
                                return <span
                                    key={key}
                                    title={translate('REJECTED_REQUESTS.ERROR_FETCH_LIST', {number: maxVisible})}
                                    style={{margin: '0 2px'}}
                                >...</span>;
                            }
                        }
                    }
                });
            }
        }
        return null;
    }
}

ReferenceValues.propTypes = {
    styles: PropTypes.object,
};

ReferenceValues.defaultProps = {
    references: '',
    maxVisible: 1000,
    hasDelete: true,
    styles: {},
};

export default ReferenceValues;
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import styles from "@themes/default/general/change_component";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import {isString} from "@utils/app";
import Body from "@change_component/form_elements/form_connection/form_methods/method/Body";
import {CONNECTOR_FROM, CONNECTOR_TO} from "@classes/components/content/connection/CConnectorItem";


class Fields extends Component{
    constructor(props) {
        super(props);

        this.state = {
            isExpanded: false,
            currentIndex: 0,
        };
    }

    toggleExpanded(){
        this.setState({
            isExpanded: !this.state.isExpanded,
            currentIndex: this.state.isExpanded ? 0 : this.state.currentIndex,
        });
    }

    increaseCurrentIndex(){
        this.setState({currentIndex: this.state.currentIndex + 1});
    }

    decreaseCurrentIndex(){
        this.setState({currentIndex: this.state.currentIndex - 1});
    }

    render(){
        const {isExpanded, currentIndex} = this.state;
        let {fields, currentTable} = this.props;
        if(fields.length === 0){
            return null;
        }
        const isDisabledPrevious = currentIndex === 0;
        const isDisabledNext = currentIndex === fields[0].values.length - 1;
        const hasExpansion = fields[0].values.length > 1;
        const hasLoopNavigation = isExpanded && fields[0].values.length > 1;
        const loopNavigationStyle = {top: fields.length === 1 ? 0 : '8px'};
        if(currentTable === CONNECTOR_FROM){
            loopNavigationStyle.left = '43%';
        } else{
            loopNavigationStyle.left = '27%';
        }

        fields = !isExpanded ? [fields[0]] : fields;
        return(
            <>
                {
                    hasExpansion ?
                        <TooltipFontIcon className={styles.expand} onClick={::this.toggleExpanded} tooltip={isExpanded ? 'minimize' : 'maximize'} value={isExpanded ? 'remove' : 'add'}/>
                        :
                        null
                }
                {
                    hasLoopNavigation
                        ?
                        <div className={styles.loop_navigation} style={loopNavigationStyle}>
                            <TooltipFontIcon tooltip={'Previous'} value={'keyboard_arrow_up'} className={`${styles.previous} ${isDisabledPrevious ? styles.disabled : ''}`} onClick={isDisabledPrevious ? null : ::this.decreaseCurrentIndex}/>
                            <span className={styles.current_index}>{currentIndex + 1}</span>
                            <TooltipFontIcon tooltip={'Next'} value={'keyboard_arrow_down'} className={`${styles.next} ${isDisabledNext ? styles.disabled : ''}`} onClick={isDisabledNext ? null : ::this.increaseCurrentIndex}/>
                        </div>
                        :
                        null
                }
                <div className={styles.fields} style={{minHeight: hasLoopNavigation ? '64px' : ''}}>
                    {
                        fields.map((field, index) => {
                            let value = currentTable === CONNECTOR_FROM ? field.values[currentIndex] : field.enhancements[currentIndex];
                            const isStringValue = isString(value);
                            const valueStyle = {paddingLeft: fields.length > 3 ? '8px' : 0};
                            const nameStyle = {};
                            const dependenciesStyle = {};
                            if(!isStringValue){
                                valueStyle.paddingBottom = '5px';
                                valueStyle.marginLeft = '-5px';
                            }
                            if(currentTable === CONNECTOR_FROM){
                                valueStyle.width = '50%';
                                nameStyle.width = '50%';
                            } else{
                                valueStyle.width = '33%';
                                nameStyle.width = '33%';
                                dependenciesStyle.width = '34%';
                            }
                            return(
                                <React.Fragment key={field.name}>
                                    <div key={field.name} className={styles.field} style={nameStyle} title={field.name}>{field.name}</div>
                                    <div
                                        className={styles.value}
                                        style={valueStyle}>
                                        {

                                            isStringValue
                                            ?
                                                <span title={value}>{value}</span>
                                            :
                                                <Body bodyStyles={{top: 0}} readOnly={true} method={{request: {body: value}}} id={'key'}/>
                                        }
                                    </div>
                                    {
                                        currentTable === CONNECTOR_TO
                                        ?
                                            <div className={styles.dependencies} style={dependenciesStyle}>
                                                {
                                                    field.dependencies.map(dependency => {
                                                        return(
                                                            <span key={`${dependency.color}_${dependency.name}`} title={`${dependency.name}`} className={styles.dependency} style={{background: dependency.color}}>
                                                                {dependency.values[currentIndex]}
                                                            </span>
                                                        )
                                                    })
                                                }
                                            </div>
                                        :
                                            null
                                    }
                                </React.Fragment>
                            );
                        })
                    }
                </div>
            </>
        );
    }
}

Fields.propTypes = {
    fields: PropTypes.array.isRequired,
};

Fields.defaultProps = {
    fields: [],
};

export default Fields;
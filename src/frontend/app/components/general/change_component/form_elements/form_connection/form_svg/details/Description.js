import React from 'react';
import styles from "@themes/default/content/connections/connection_overview_2";
import CProcess from "@classes/components/content/connection_overview_2/process/CProcess";
import COperator from "@classes/components/content/connection_overview_2/operator/COperator";

class Description extends React.Component{
    constructor(props) {
        super(props);
    }

    renderForOperator(){
        const {details} = this.props;
        const {entity} = details;
        return(
            <React.Fragment>
                <div>
                    <span>{`Condition: `}</span>
                    {entity.condition.generateStatementText()}
                </div>
            </React.Fragment>
        );
    }

    renderForProcess(){
        const {details} = this.props;
        return(
            <React.Fragment>
                {details.label && <React.Fragment><span>Label</span>: <b>{details.label}</b><br/></React.Fragment>}
                {details.name && <React.Fragment><span>Name: {details.name}</span><br/></React.Fragment>}
                {details.invoker && `Invoker: ${details.invoker}`}
            </React.Fragment>
        );
    }

    render(){
        const {details} = this.props;
        return(
            <div className={styles.label}>
                {details instanceof CProcess && this.renderForProcess()}
                {details instanceof COperator && this.renderForOperator()}
            </div>
        );
    }
}

export default Description;
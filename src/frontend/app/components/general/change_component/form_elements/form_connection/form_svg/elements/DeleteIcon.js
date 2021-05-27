import React from 'react';
import styles from "@themes/default/content/connections/connection_overview_2";
import Confirmation from "@components/general/app/Confirmation";
import {Col} from "react-grid-system";

class DeleteIcon extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            isConfirmationShown: false,
        };
    }

    toggleConfirmation(){
        this.setState({
            isConfirmationShown: !this.state.isConfirmationShown,
        })
    }

    onClick(e){
        const {onClick} = this.props;
        onClick(e);
        this.toggleConfirmation();
    }

    render(){
        const {isConfirmationShown} = this.state;
        const {svgX, svgY, x, y} = this.props;
        return(
            <svg x={svgX} y={svgY}>
                <path className={styles.process_delete} x={x} y={y} onClick={::this.toggleConfirmation} xmlns="http://www.w3.org/2000/svg" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z">
                    <title>{'Delete'}</title>
                </path>
                <Confirmation
                    okClick={::this.onClick}
                    cancelClick={::this.toggleConfirmation}
                    active={isConfirmationShown}
                    title={'Confirmation'}
                    message={'Do you really want to delete?'}
                />
            </svg>
        );
    }
}

DeleteIcon.defaultProps = {
    svgX: 0,
    svgY: 0,
    x: 0,
    y: 0,
};

export default DeleteIcon;
import React, {Component} from "react";
import FormMode from "@change_component/form_elements/form_connection/FormMode";
import Dialog from "@basic_components/Dialog";
import Button from "@basic_components/buttons/Button";
import {TEMPLATE_MODE} from "@classes/content/connection/CTemplate";
import Confirmation from "@components/general/app/Confirmation";

/**
 * Load Template Component
 */
class LoadTemplate extends Component {

    constructor(props) {
        super(props);

        this.state = {
            showDialog: false,
        }
    }

    render(){
        const {showDialog} = this.state;
        return (
            <React.Fragment>
                <Button hasConfirmation={true} confirmationText={'If you load a template, all your changes in methods will be lost. Are you sure?'} label={'Load Template'} onClick={() => this.setState({showDialog: true})}/>
                <Dialog
                    actions={[{label: 'Close', id: 'close_load_template', onClick: () => this.setState({showDialog: false})}]}
                    active={showDialog}
                    toggle={() => this.setState({showDialog: !showDialog})}
                    title={'Load Template'}
                >
                    <FormMode {...this.props} data={{...this.props.data, visible: true}} showMode={false} defaultMode={TEMPLATE_MODE}/>
                </Dialog>
            </React.Fragment>
        )
    }
}

export default LoadTemplate;

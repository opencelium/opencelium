import React from 'react';
import {connect} from 'react-redux';
import Button from "@basic_components/buttons/Button";
import styles from "@themes/default/general/form_methods";

const ONLINE_UPDATE = 'ONLINE_UPDATE';
const OFFLINE_UPDATE = 'OFFLINE_UPDATE';

function mapStateToProps(state){
    const auth = state.get('auth');
    return{
        authUser: auth.get('authUser'),
    };
}

@connect(mapStateToProps, {})
class AvailableUpdates extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            activeMode: ONLINE_UPDATE,
        }
    }

    selectMode(e, activeMode){
        this.setState({
            activeMode,
        });
    }

    render(){
        const {activeMode} = this.state;
        const {authUser} = this.props;
        return(
            <div style={{margin: '20px 68px 0 0'}}>
                <div style={{textAlign: 'center'}}>
                    <Button
                        isActive={activeMode === ONLINE_UPDATE}
                        authUser={authUser}
                        title={'Online'}
                        onClick={(e) => ::this.selectMode(e, ONLINE_UPDATE)}
                        className={styles.expert_button}
                    />
                    <Button
                        isActive={activeMode === OFFLINE_UPDATE}
                        authUser={authUser}
                        title={'Offline'}
                        onClick={(e) => ::this.selectMode(e, OFFLINE_UPDATE)}
                        className={styles.template_button}
                    />
                </div>
            </div>
        );
    }
}

export default AvailableUpdates;
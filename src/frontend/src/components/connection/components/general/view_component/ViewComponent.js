import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import styles from '@themes/default/general/view_component.scss';
import ListHeader from "@components/general/list_of_components/Header";
import ListButton from "@components/general/view_component/ListButton";
import {permission} from "@decorators/permission";


function mapStateToProps(state){
    const authUser = state.authReducer.authUser;
    return {
        authUser,
    };
}

@connect(mapStateToProps, {})
@permission()
class ViewComponent extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {header, listButton} = this.props;
        return(
            <div>
                <ListHeader header={header}/>
                {listButton &&
                    <ListButton
                        title={listButton.title}
                        link={listButton.link}
                        permission={listButton.permission}
                    />
                }
                <div className={styles.view_component}>
                    {this.props.children}
                </div>
            </div>
        );
    }
}

ViewComponent.propTypes = {
    header: PropTypes.string.isRequired,
    listButton: PropTypes.shape({
        title: PropTypes.string.isRequired,
        link: PropTypes.string.isRequired,
    }),
    permission: PropTypes.string.isRequired,
}

export default ViewComponent;
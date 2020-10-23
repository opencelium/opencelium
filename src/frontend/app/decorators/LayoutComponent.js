import React, {Suspense} from 'react';
import {connect} from "react-redux";
import CVoiceControl from "@classes/voice_control/CVoiceControl";
import {setCurrentPageItems} from "@actions/app";
import {Container} from "react-grid-system";
import Loading from "@components/general/app/Loading";
import ComponentError from "@components/general/app/ComponentError";
import {ERROR_TYPE} from "@utils/constants/app";


function mapStateToProps(state){
    const app = state.get('app');
    return {
        currentPageItems: app.get('currentPageItems').toJS(),
    };
}
export function LayoutComponent(componentSingleName = '', componentPluralName = '', url = '', deleteActionName = ''){
    return function (Component) {
        return (
            @connect(mapStateToProps, {setCurrentPageItems})
            class C extends React.Component {

                componentDidMount(){
                    CVoiceControl.initCommands({component: this, currentItems: this.props.currentPageItems, componentSingleName, componentPluralName, url, deleteActionName});
                }

                componentDidUpdate(){
                    CVoiceControl.initCommands({component: this, currentItems: this.props.currentPageItems, componentSingleName, componentPluralName, url, deleteActionName});
                }

                componentWillUnmount(){
                    CVoiceControl.removeCommands({component: this, currentItems: this.props.currentPageItems, componentSingleName, componentPluralName, url, deleteActionName});
                    this.props.setCurrentPageItems([]);
                }

                render(){
                    const {children} = this.props;
                    return (
                        <Container>
                            <Suspense fallback={(<Loading/>)}>
                                <ComponentError entity={{type: ERROR_TYPE.FRONTEND, name: componentSingleName}}>
                                    {children}
                                </ComponentError>
                            </Suspense>
                        </Container>
                    );
                }
            }
        );
    };
}

export default LayoutComponent;
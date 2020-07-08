import React, {Component} from 'react';
import {connect} from 'react-redux';
import Button from "@basic_components/buttons/Button";
import styles from "@themes/default/general/change_component";
import {getThemeClass} from "@utils/app";
import {checkConnection} from "@actions/connections/check";
import {API_REQUEST_STATE} from "@utils/constants/app";
import Loading from "@components/general/app/Loading";
import Dialog from "@basic_components/Dialog";
import {Table} from "reactstrap";
import Fields from "@change_component/extra_actions/check_connection/Fields";
import Pagination from "@basic_components/pagination/Pagination";
import {CONNECTOR_FROM, CONNECTOR_TO} from "@classes/components/content/connection/CConnectorItem";

const METHODS_PER_PAGE = 3;

const TEST_DATA = {
    "fromConnector" :{
        "name": "idoit",
        "methods": [
            {
                "name":"cmdb.objects.read",
                "color": "#FFCFB5",
                "loopLength" : [2, 5, 3],
                "fields": [
                    {
                        "name": "result.title",
                        "values": ['title 1','title 2','title 3','title 4','title 5','title 6','title 7','title 8','title 9','title 10','title 11','title 12','title 13','title 14','title 15','title 16','title 17','title 18','title 19','title 20','title 21','title 22','title 23','title 24','title 25','title 26','title 27','title 28','title 29','title 30',]
                    },
                    {
                        "name": 'result.cmdb_status_title',
                        "values": ['in operative 1','in operative 2','in operative 3','in operative 4','in operative 5','in operative 6','in operative 7','in operative 8','in operative 9','in operative 10','in operative 11','in operative 12','in operative 13','in operative 14','in operative 15','in operative 16','in operative 17','in operative 18','in operative 19','in operative 20','in operative 21','in operative 22','in operative 23','in operative 24','in operative 25','in operative 26','in operative 27','in operative 28','in operative 29','in operative 30',]
                    }
                ]
            },
            {
                "name":"cmdb.category.read",
                "color": "#C77E7E",
                "loopLength" : [2],
                "fields": [
                    {
                        "name": "result",
                        "values": [[{manufacturer: {title: 'canon'}}], [{manufacturer: {title: 'hp'}}]]
                    }
                ]
            },
            {
                "name":"cmdb.objects.read2",
                "color": "#2FCFB5",
                "loopLength" : [2],
                "fields": [
                    {
                        "name": "result.title",
                        "values": ['title 1','title 2'],
                    },
                    {
                        "name": 'result.cmdb_status_title',
                        "values": ['in operative', 'in operative'],
                    }
                ]
            },
            {
                "name":"cmdb.objects.read3",
                "color": "#A3CFB5",
                "loopLength" : [2],
                "fields": [
                    {
                        "name": "result.title",
                        "values": ['title 1','title 2'],
                    },
                    {
                        "name": 'result.cmdb_status_title',
                        "values": ['in operative', 'in operative'],
                    }
                ]
            },
        ]
    },
    "toConnector": {
        "name": "otrs",
        "methods":[
            {
                "name":"ConfigItemCreate",
                "color": "#6477AB",
                "loopLength" : [2, 5, 3],
                "fields": [
                    {
                        "name": "ConfigItem.Name",
                        "values": ['title 1','title 2','title 3','title 4','title 5','title 6','title 7','title 8','title 9','title 10','title 11','title 12','title 13','title 14','title 15','title 16','title 17','title 18','title 19','title 20','title 21','title 22','title 23','title 24','title 25','title 26','title 27','title 28','title 29','title 30',],
                        "dependencies": [
                            {
                                "color": "#FFCFB5",
                                "name": "result.title",
                                "values": ['title 1','title 2','title 3','title 4','title 5','title 6','title 7','title 8','title 9','title 10','title 11','title 12','title 13','title 14','title 15','title 16','title 17','title 18','title 19','title 20','title 21','title 22','title 23','title 24','title 25','title 26','title 27','title 28','title 29','title 30',]
                            }
                        ]
                    },{
                        "name": "ConfigItem.CIXMLData.Vendor",
                        "values": ["Canon","XP","Canon","XP","Canon","XP","Canon","XP","Canon","XP","Canon","XP","Canon","XP","Canon","XP","Canon","XP","Canon","XP","Canon","XP","Canon","XP","Canon","XP","Canon","XP","Canon","XP",],
                        "dependencies": [
                            {
                                "color": "#C77E7E",
                                "name": "result",
                                "values": [[{manufacturer: {title: 'canon'}}], [{manufacturer: {title: 'hp'}}],[{manufacturer: {title: 'canon'}}], [{manufacturer: {title: 'hp'}}],[{manufacturer: {title: 'canon'}}], [{manufacturer: {title: 'hp'}}],[{manufacturer: {title: 'canon'}}], [{manufacturer: {title: 'hp'}}],[{manufacturer: {title: 'canon'}}], [{manufacturer: {title: 'hp'}}],[{manufacturer: {title: 'canon'}}], [{manufacturer: {title: 'hp'}}],[{manufacturer: {title: 'canon'}}], [{manufacturer: {title: 'hp'}}],[{manufacturer: {title: 'canon'}}], [{manufacturer: {title: 'hp'}}],[{manufacturer: {title: 'canon'}}], [{manufacturer: {title: 'hp'}}],[{manufacturer: {title: 'canon'}}], [{manufacturer: {title: 'hp'}}],[{manufacturer: {title: 'canon'}}], [{manufacturer: {title: 'hp'}}],[{manufacturer: {title: 'canon'}}], [{manufacturer: {title: 'hp'}}],[{manufacturer: {title: 'canon'}}], [{manufacturer: {title: 'hp'}}],[{manufacturer: {title: 'canon'}}], [{manufacturer: {title: 'hp'}}],[{manufacturer: {title: 'canon'}}], [{manufacturer: {title: 'hp'}}],]
                            }
                        ]
                    },{
                        "name": "ConfigItem.InciState",
                        "values": ["Operational","Not Operational","Operational","Not Operational","Operational","Not Operational","Operational","Not Operational","Operational","Not Operational","Operational","Not Operational","Operational","Not Operational","Operational","Not Operational","Operational","Not Operational","Operational","Not Operational","Operational","Not Operational","Operational","Not Operational","Operational","Not Operational","Operational","Not Operational","Operational","Not Operational",],
                        "dependencies": [
                            {
                                "color": "#A3CFB5",
                                "name": "result.cmdb_status_title",
                                "values": ["in operative", "in operative","in operative", "in operative","in operative", "in operative","in operative", "in operative","in operative", "in operative","in operative", "in operative","in operative", "in operative","in operative", "in operative","in operative", "in operative","in operative", "in operative","in operative", "in operative","in operative", "in operative","in operative", "in operative","in operative", "in operative","in operative", "in operative",]
                            }
                        ]
                    },
                ]
            },
        ]
    }
};

function mapStateToProps(state){
    const auth = state.get('auth');
    const connections = state.get('connections');
    return {
        authUser: auth.get('authUsers'),
        checkingConnection: connections.get('checkingConnection'),
        checkConnectionResult: connections.get('checkConnectionResult'),
    };
}

@connect(mapStateToProps, {checkConnection})
class CheckConnection extends Component{
    constructor(props) {
        super(props);

        this.state = {
            startCheckingConnection: false,
            showResult: false,
            currentPage: 1,
            currentTable: CONNECTOR_FROM,
            selectedField: null,
        };
        this.buttonWidth = '';
    }

    componentDidMount(){
        this.buttonWidth = document.getElementById('button_check').offsetWidth;
    }

    componentDidUpdate(){
        if(this.props.checkingConnection !== API_REQUEST_STATE.START && this.state.startCheckingConnection){
            this.setState({startCheckingConnection: false});
        }
    }

    /**
     * to select field when clicked on dependency
     */
    selectFieldByDependency(dependency){
        if(dependency) {
            const methods = TEST_DATA.fromConnector.methods;
            const methodIndex = methods.findIndex(m => m.color === dependency.color);
            if (methodIndex !== -1) {
                const method = methods[methodIndex];
                const fieldIndex = method.fields.findIndex(f => f.name === dependency.name);
                const field = method.fields[fieldIndex];
                this.setState({
                    currentTable: CONNECTOR_FROM,
                    selectedField: {...field, currentIndex: dependency.currentIndex, color: method.color},
                    currentPage: parseInt(methodIndex / METHODS_PER_PAGE) + 1,
                });
            }
        } else{
            this.setState({
                selectedField: null,
            });
        }
    }

    /**
     * to show from or to connector table
     */
    setCurrentTable(currentTable){
        this.setState({currentTable, currentPage: 1, selectedField: null});
    }

    /**
     * to open page
     */
    setCurrentPage(currentPage){
        this.setState({currentPage, selectedField: null});
    }

    /**
     * to toggle result of checking connection
     */
    toggleResult(){
        this.setState({showResult: !this.state.showResult});
    }

    /**
     * to check connection
     */
    check(){
        this.props.checkConnection();
        this.setState({startCheckingConnection: true, showResult: true});
    }

    renderTableHead(){
        const {currentTable} = this.state;
        if(currentTable === CONNECTOR_FROM){
            return(
                <tr>
                    <th style={{width: '20%'}}>Method</th>
                    <th style={{width: '30%', paddingLeft: '27px'}}>Field</th>
                    <th style={{width: '30%', paddingLeft: '6px'}}>Value</th>
                </tr>
            );
        }
        return(
            <tr>
                <th style={{width: '25%'}}>Method</th>
                <th style={{width: '25%', paddingLeft: '27px'}}>Field</th>
                <th style={{width: '25%', paddingLeft: '10px'}}>Value</th>
                <th style={{width: '25%', paddingLeft: '0'}}>Dependencies</th>
            </tr>
        );
    }

    renderTableBody(){
        const {currentTable, selectedField, currentPage} = this.state;
        const {checkConnectionResult} = this.props;
        const data = currentTable === CONNECTOR_FROM ? TEST_DATA.fromConnector : TEST_DATA.toConnector;
        return data.methods.map((method, key) => {
            let startIndex = (currentPage - 1) * METHODS_PER_PAGE;
            let lastIndex = startIndex + METHODS_PER_PAGE;
            if(key >= startIndex && key < lastIndex) {
                return (
                    <tr key={method.color}>
                        <td style={{width: '20%', paddingTop: '11px'}}><span className={styles.method_name} style={{background: method.color}} title={method.name}>{method.name}</span></td>
                        <td style={{width: '80%', paddingTop: 0, position: 'relative'}} colSpan={currentTable === CONNECTOR_FROM ? 2 : 3}>
                            <Fields fields={method.fields} loopLength={method.loopLength} currentTable={currentTable} selectFieldByDependency={::this.selectFieldByDependency} selectedField={selectedField && selectedField.color === method.color ? selectedField : null}/>
                        </td>
                    </tr>
                );
            }
            return null;
        })
    }

    renderTable(){
        const {currentTable} = this.state;
        const data = currentTable === CONNECTOR_FROM ? TEST_DATA.fromConnector : TEST_DATA.toConnector;
        const page = {
            entitiesLength: data.methods.length,
            pageNumber: this.state.currentPage,
            link: ''
        };
        return(
            <React.Fragment>
                <Table className={styles.check_connection}>
                    <thead>
                        {this.renderTableHead()}
                    </thead>
                    <tbody>
                        {this.renderTableBody()}
                    </tbody>
                </Table>
                <Pagination loadPage={::this.setCurrentPage} page={page} setTotalPages={() => {}} entitiesProPage={METHODS_PER_PAGE}/>
            </React.Fragment>
        )
    }

    renderResult(){
        const {currentTable} = this.state;
        const {currentConnection} = this.props;
        return(
            <Dialog
                actions={[{label: 'Ok', onClick: ::this.toggleResult, id: 'check_result_ok'}]}
                active={this.state.showResult}
                onEscKeyDown={::this.toggleResult}
                onOverlayClick={::this.toggleResult}
                title={'Result of Connection Check'}
            >
                <div>
                    <Button
                        isActive={currentTable === CONNECTOR_FROM}
                        title={currentConnection.fromConnector.title}
                        onClick={() => ::this.setCurrentTable(CONNECTOR_FROM)}
                        className={styles.from_connector_button}
                    />
                    <Button
                        isActive={currentTable === CONNECTOR_TO}
                        title={currentConnection.toConnector.title}
                        onClick={() => ::this.setCurrentTable(CONNECTOR_TO)}
                        className={styles.to_connector_button}
                    />
                </div>
                {this.renderTable()}
            </Dialog>
        );
    }

    render(){
        const {startCheckingConnection} = this.state;
        const {authUser} = this.props;
        let classNames = [
            'navigation_action_icon',
            'navigation_extra_action_loading'
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        if(startCheckingConnection){
            return <Loading className={styles[classNames.navigation_extra_action_loading]} style={{marginRight: `calc(${this.buttonWidth}px / 2 - 8px)`}}/>;
        }
        return(
            <div>
                <Button
                    authUser={authUser}
                    title={'Check'}
                    icon={'donut_large'}
                    onClick={::this.check}
                    className={styles[classNames.navigation_action_icon]}
                />
                {this.renderResult()}
            </div>
        )
    }
}

export default CheckConnection;
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
                "name":"cmdb.objects.readcmdb.objects.read",
                "color": "#FFCFB5",
                "fields": [
                    {
                        "name": "result.titleresult.titleresult.titlesult.titlesult.title",
                        "values": [{'test': '123'}, "345345345345345345345345345345345345345345345345345345345345", "678"]
                    },
                    {
                        "name": "result.status",
                        "values": [{'text': 'in operative'}, {'test': '345'}, "nnn"]
                    },
                    {
                        "name": "plan",
                        "values": [{'b': 'c'}, "B", [{"test": "test"}]]
                    },
                    {
                        "name": "q",
                        "values": ["z", "x", [{"c": "v"}]]
                    },
                ]
            },
            {
                "name":"cmdb.category.read",
                "color": "#C77E7E",
                "fields": [
                    {
                        "name": "result.title",
                        "values": ["123"]
                    }
                ]
            },
            {
                "name":"cmdb.read",
                "color": "#177E7E",
                "fields": [
                    {
                        "name": "result.title",
                        "values": ["123", "2"]
                    }
                ]
            },
            {
                "name":"cmdb.category.read",
                "color": "#C74E7E",
                "fields": [
                    {
                        "name": "result.title",
                        "values": ["123"]
                    }
                ]
            },
            {
                "name":"cmdb.read",
                "color": "#172E7E",
                "fields": [
                    {
                        "name": "result.title",
                        "values": ["123", "2"]
                    }
                ]
            },
        ]
    },
    "toConnector": {
        "name": "otrs",
        "methods":[
            {
                "name":"ConfigItemSearch",
                "color": "#6477AB",
                "fields": [
                    {
                        "name": "result.titleresult.titleresult.titleresult.title",
                        "values": [
                            "prev_title_1prev_title_1prev_title_1prev_title_1",
                            "prev_title_2",
                        ],
                        "enhancements": [
                            "next_title_1next_title_1next_title_1",
                            "next_title_2next_title_2next_title_2next_title_2next_title_2"
                        ],
                        "dependencies": [
                            {
                                "color": "#FFCFB5",
                                "name": "result.titleresult.titleresult.titleresult.title",
                                "values": ["first_titlefirst_titlefirst_titlefirst_title", "second_title"]
                            },
                            {
                                "color": "#FFCFB5",
                                "name": "port",
                                "values": ["0000", "8888"]
                            }
                        ]
                    },{
                        "name": "result.status",
                        "values": [
                            "prev_status_1",
                            "prev_status_2",
                        ],
                        "enhancements": [
                            "next_status_1",
                            "next_status_2"
                        ],
                        "dependencies": [
                            {
                                "color": "#C77E7E",
                                "name": "result.cmdb_status",
                                "values": ["in operation", "opened"]
                            },
                            {
                                "color": "#FFCFB5",
                                "name": "title",
                                "values": ["title_1", "title_2"]
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

    setCurrentTable(currentTable){
        this.setState({currentTable, currentPage: 1});
    }

    setCurrentPage(currentPage){
        this.setState({currentPage});
    }

    toggleResult(){
        this.setState({showResult: !this.state.showResult});
    }

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
                    <th style={{width: '30%', paddingLeft: '22px'}}>Field</th>
                    <th style={{width: '30%', paddingLeft: '0'}}>Value</th>
                </tr>
            );
        }
        return(
            <tr>
                <th style={{width: '25%'}}>Method</th>
                <th style={{width: '25%', paddingLeft: '22px'}}>Field</th>
                <th style={{width: '25%', paddingLeft: '22px'}}>Value</th>
                <th style={{width: '25%', paddingLeft: '0'}}>Dependencies</th>
            </tr>
        );
    }

    renderTableBody(){
        const {currentTable} = this.state;
        const {currentPage} = this.state;
        const {checkConnectionResult} = this.props;
        const data = currentTable === CONNECTOR_FROM ? TEST_DATA.fromConnector : TEST_DATA.toConnector;
        return data.methods.map((method, key) => {
            let startIndex = (currentPage - 1) * METHODS_PER_PAGE;
            let lastIndex = startIndex + METHODS_PER_PAGE;
            if(key >= startIndex && key < lastIndex) {
                return (
                    <tr key={method.color}>
                        <td style={{width: '20%', paddingTop: '15px'}}><span className={styles.method_name} style={{background: method.color}} title={method.name}>{method.name}</span></td>
                        <td style={{width: '80%', paddingTop: 0, position: 'relative'}} colSpan={currentTable === CONNECTOR_FROM ? 2 : 3}>
                            <Fields fields={method.fields} currentTable={currentTable}/>
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
                <Pagination loadPage={::this.setCurrentPage} page={page} setTotalPages={() => {}}/>
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
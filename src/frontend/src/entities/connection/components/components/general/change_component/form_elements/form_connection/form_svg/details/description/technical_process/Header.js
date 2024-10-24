/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react';
import {Col, Row} from "react-grid-system";
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import TooltipFontIcon from "@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon";
import Dialog from "@entity/connection/components/components/general/basic_components/Dialog";
import Table from "@entity/connection/components/components/general/basic_components/table/Table";
import ReactDOM from "react-dom";

class Header extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            isHeaderVisible: false,
        }
    }

    toggleHeaderVisible(){
        const {setCurrentInfo, nameOfCurrentInfo} = this.props;
        if(setCurrentInfo) setCurrentInfo(nameOfCurrentInfo);
        this.setState({
            isHeaderVisible: !this.state.isHeaderVisible,
        });
    }

    renderItems(){
        const {items} = this.props;
        if(items.length === 0){
            return (
                <div>
                    {'The header is empty'}
                </div>
            )
        }
        return (
            <React.Fragment>
                <Table className={styles.header_head}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                </Table>
                <div className={styles.header_body}>
                    <Table>
                        <tbody>
                        {
                            items.map(item =>
                                <tr key={item.name}>
                                    <td>{item.name}</td>
                                    <td>{item.value}</td>
                                </tr>
                            )
                        }
                        </tbody>
                    </Table>
                </div>
            </React.Fragment>
        );
    }

    render(){
        const {isHeaderVisible} = this.state;
        const {isExtended, isCurrentInfo} = this.props;
        return(
            <React.Fragment>
                <Col id='header_label' xs={4} className={`${styles.col} ${styles.entry_padding}`}>{`Header`}</Col>
                <Col id='header_option' xs={8} className={`${styles.col}`}>
                    <TooltipFontIcon tooltipPosition={'right'} onClick={() => this.toggleHeaderVisible()} size={14} value={<span className={styles.more_details}>{`H`}</span>} tooltip={'Show'}/>
                </Col>
                {isExtended && isCurrentInfo &&
                    ReactDOM.createPortal(
                        this.renderItems(), document.getElementById('extended_details_information')
                    )
                }
                <Dialog
                    actions={[{label: 'Ok', onClick: () => this.toggleHeaderVisible(), id: 'header_ok'}]}
                    active={isHeaderVisible && !isExtended}
                    toggle={() => this.toggleHeaderVisible()}
                    title={'Header'}
                    theme={{dialog: styles.header_dialog}}
                >
                    {this.renderItems()}
                </Dialog>
            </React.Fragment>
        );
    }
}

export default Header;

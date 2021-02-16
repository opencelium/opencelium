import React from 'react';
import FontIcon from "@basic_components/FontIcon";
import { Container, Row, Col } from "react-grid-system";

import styles from '@themes/default/content/connections/list.scss'
import {checkImage} from "@utils/app";

//add canvas when icon will be ready
const DefaultIcon = (props) => {
    return (
        <span>{props.name}</span>
    )
}

export default class ConnectionCardTitle extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            isMouseOver: false,
            isCorrectFromIcon: false,
            isCorrectToIcon: false,
        };
        this.notMounted = true;
    }

    componentDidMount(){
        const {fromInvoker, toInvoker} = this.props;
        checkImage(fromInvoker.icon, () => this.setState({isCorrectFromIcon: true}), () => this.setState({isCorrectFromIcon: false}));
        checkImage(toInvoker.icon, () => this.setState({isCorrectToIcon: true}), () => this.setState({isCorrectToIcon: false}));
        this.notMounted = false;
    }

    handleMouseOver(){
        this.setState({
            isMouseOver: true,
        })
    }

    handleMouseLeave(){
        this.setState({
            isMouseOver: false,
        })
    }

    render() {
        if(this.notMounted){
            return null;
        }
        const {isMouseOver, isCorrectFromIcon, isCorrectToIcon} = this.state;
        const {fromInvoker, toInvoker, title} = this.props;
        let iconsStyles = {
            opacity: 0.5,
        };
        let fromStyles = {
            minHeight: '20px !important',
            lineHeight: '20px',
        };
        let toStyles = {
            minHeight: '20px !important',
            lineHeight: '20px',
        };
        let arrowIconStyles = {
            marginTop: 0,
        };
        let imgStyles = {
            maxHeight: '20px',
        };
        if(isMouseOver){
            iconsStyles = {
                opacity: 1,
            }
            fromStyles = {
                minHeight: '40px !important',
                lineHeight: '40px',
            };
            toStyles = {
                minHeight: '40px !important',
                lineHeight: '40px',
            };
            arrowIconStyles = {
                marginTop: '8px',
            };
            imgStyles = {
                maxHeight: '40px',
            };
        }
        return (
            <Container className={styles.connection_card_title} onMouseOver={::this.handleMouseOver} onMouseLeave={::this.handleMouseLeave}>
                <Row className={styles.icons} style={iconsStyles}>
                    <Col md={5} className={styles.from} style={fromStyles}>
                        {isCorrectFromIcon ?
                            <img alt={fromInvoker.name} src={fromInvoker.icon} style={imgStyles}/>
                        :
                            <DefaultIcon name={fromInvoker.name} isMouseOver={isMouseOver}/>
                        }
                    </Col>
                    <Col md={2} className={styles.arrow}>
                        <FontIcon value={'arrow_forward'} className={styles.arrow_icon} style={arrowIconStyles}/>
                    </Col>
                    <Col md={5} className={styles.to} style={toStyles}>
                        {isCorrectToIcon ?
                            <img alt={toInvoker.name} src={toInvoker.icon} style={imgStyles}/>
                            :
                            <DefaultIcon name={toInvoker.name} isMouseOver={isMouseOver}/>
                        }
                    </Col>
                </Row>
                <Row>
                    <Col className={styles.title} md={12}>{title}</Col>
                </Row>
            </Container>
        )
    }
}
import React from 'react';
import FontIcon from "@basic_components/FontIcon";
import { Container, Row, Col } from "react-grid-system";

import styles from '@themes/default/content/connections/list.scss'
import {checkImage, isString} from "@utils/app";
import CConnectorItem from "@classes/components/content/connection/CConnectorItem";

//add canvas when icon will be ready
const DefaultIcon = (props) => {
    return (
        <span>{props.title}</span>
    )
}

export default class ConnectionCardTitle extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            isMouseOver: false,
            isCorrectFromIcon: false,
            isCorrectToIcon: false,
            ...this.getIcons(props),
        };
        this.notMounted = true;
    }

    componentDidMount(){
        const {fromIcon, toIcon} = this.state;
        checkImage(fromIcon, () => this.setState({isCorrectFromIcon: true}), () => this.setState({isCorrectFromIcon: false}));
        checkImage(toIcon, () => this.setState({isCorrectToIcon: true}), () => this.setState({isCorrectToIcon: false}));
        this.notMounted = false;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(prevProps.fromConnector.icon !== this.props.fromConnector.icon || prevProps.toConnector.icon !== this.props.toConnector.icon){
            this.state({
                ...this.getIcons(this.props),
            })
        }
    }

    getIcons(props){
        const hasFromConnectorIcon = CConnectorItem.hasIcon(props.fromConnector.icon);
        const hasToFromConnectorIcon = CConnectorItem.hasIcon(props.toConnector.icon);
        const fromIcon = hasFromConnectorIcon ? props.fromConnector.icon : props.fromConnector.invoker.icon;
        const toIcon = hasToFromConnectorIcon ? props.toConnector.icon : props.toConnector.invoker.icon;
        return {fromIcon, toIcon};
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
        const {isMouseOver, isCorrectFromIcon, isCorrectToIcon, fromIcon, toIcon} = this.state;
        const {fromConnector, toConnector, title} = this.props;
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
                            <img alt={fromConnector.title} src={fromIcon} style={imgStyles}/>
                        :
                            <DefaultIcon title={fromConnector.title} isMouseOver={isMouseOver}/>
                        }
                    </Col>
                    <Col md={2} className={styles.arrow}>
                        <FontIcon value={'arrow_forward'} className={styles.arrow_icon} style={arrowIconStyles}/>
                    </Col>
                    <Col md={5} className={styles.to} style={toStyles}>
                        {isCorrectToIcon ?
                            <img alt={toConnector.title} src={toIcon} style={imgStyles}/>
                            :
                            <DefaultIcon name={toConnector.title} isMouseOver={isMouseOver}/>
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
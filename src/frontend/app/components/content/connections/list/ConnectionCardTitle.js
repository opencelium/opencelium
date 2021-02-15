import React from 'react';
import FontIcon from "@basic_components/FontIcon";
import { Container, Row, Col } from "react-grid-system";

import styles from '@themes/default/content/connections/list.scss'

export default (props) => {
    const {fromInvoker, toInvoker} = props;
    return (
        <Container className={styles.connection_card_title}>
            <Row className={styles.icons}>
                <Col md={5} className={styles.from}>
                    <img alt={fromInvoker.name} src={fromInvoker.icon}/>
                </Col>
                <Col md={2} className={styles.arrow}>
                    <FontIcon value={'arrow_forward'} className={styles.arrow_icon}/>
                </Col>
                <Col md={5} className={styles.to}>
                    <img alt={toInvoker.name} src={toInvoker.icon}/>
                </Col>
            </Row>
            <Row>
                <Col className={styles.title} md={12}>{props.title}</Col>
            </Row>
        </Container>
    )
}
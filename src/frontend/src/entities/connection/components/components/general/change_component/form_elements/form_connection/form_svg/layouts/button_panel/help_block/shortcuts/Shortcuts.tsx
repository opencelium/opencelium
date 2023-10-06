import React from "react";
import { shortcuts_data } from "./shortcuts_data";
import { Col, Row } from "reactstrap";

// @ts-ignore
import styles from "./styles.scss"

const Shortcuts = () => { 

  const getKeys = (data: any) => {
    return data.map((item: any, index: any) => (
      <span key={index}>{item}</span>
    ));
  }

  const renderShortcuts = shortcuts_data.map((shortcut, index) => {
    return <React.Fragment key={index}>
      <Col xs={4} className={styles.col}>
        {getKeys(shortcut.keys).reduce((prev:any, curr:any, index:any) => [prev, index > 0 && ' + ', curr])}
      </Col>
      <Col xs={7}>{shortcut.description}</Col>
    </React.Fragment>
  })

  return (
    <React.Fragment>
      <Row style={{gap: '20px'}}>
        <Col xs={4}>Command</Col>
        <Col xs={7}>Description</Col>
        {renderShortcuts}
      </Row>
    </React.Fragment>
  )
}

export default Shortcuts;
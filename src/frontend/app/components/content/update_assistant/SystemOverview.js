import React from "react";
import { Row, Col, Container } from "react-grid-system";

export default (props) => {
    const text = [
        ['OS:', 'Ubuntu 16.04 LTS'],
        ['JAVA:', '16.04.2'],
        ['NodeJS:', '12.1'],
        ['Neo4J:', '12.4'],
        ['Kibana:', '10.43'],
        ['Elasticsearch:', '10.42'],
        ['MariaDB:', '11.21'],
    ];
    return(
        <Container>
            {
                text.map(line => {
                    return(
                        <Row>
                            <Col md={3}>{line[0]}</Col><Col md={9}>{line[1]}</Col>
                        </Row>
                    )
                })
            }
        </Container>
    );
}


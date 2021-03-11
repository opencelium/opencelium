import React from 'react';
import Process from "@components/content/connection_overview_2/elements/Process";
import styles from "@themes/default/content/connections/connection_overview_2.scss";
import IfOperator from "@components/content/connection_overview_2/elements/IfOperator";

class BusinessLayout extends React.Component{
    constructor(props) {
        super(props);
        this.selectedElement = false;
        this.offset = {x: 0, y: 0};
    }

    startDrag(e){
        if(e.target.classList.contains('draggable')) {
            this.selectedElement = e.target.parentNode;
            this.offset = this.getMousePosition(e);
            this.offset.x -= parseFloat(this.selectedElement.getAttributeNS(null, "x"));
            this.offset.y -= parseFloat(this.selectedElement.getAttributeNS(null, "y"));
        }
    }

    drag(e){
        if (this.selectedElement) {
            e.preventDefault();
            const coordinates = this.getMousePosition(e);
            const x = coordinates.x - this.offset.x;
            const y = coordinates.y - this.offset.y;
            this.selectedElement.setAttributeNS(null, "x", x);
            this.selectedElement.setAttributeNS(null, "y", y);
        }
    }

    endDrag(){
        this.selectedElement = null;
    }

    getMousePosition(e) {
        const CTM = this.selectedElement.parentNode.getScreenCTM();
        return {
            x: (e.clientX - CTM.e) / CTM.a,
            y: (e.clientY - CTM.f) / CTM.d
        };
    }

    render(){
        return(
            <svg className={styles.business_layout} onMouseDown={::this.startDrag} onMouseMove={::this.drag} onMouseUp={::this.endDrag} onMouseLeave={::this.endDrag}>
                <Process x={20} y={20} label={'Get Clients'}/>
                <Process x={220} y={20} label={'Save Tickets'}/>
                <IfOperator x={220} y={100}/>
            </svg>
        );
    }
}

export default BusinessLayout;
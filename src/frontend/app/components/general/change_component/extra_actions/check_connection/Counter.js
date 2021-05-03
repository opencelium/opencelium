/*
 * Copyright (C) <2021>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {Component} from 'react';
import styles from "@themes/default/general/change_component";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import CFields from "@classes/components/general/change_component/extra_actions/CFields";
import Slider from "react-slick";


class Counter extends Component{
    constructor(props){
        super(props);

        this.state = {
            showArrows: false,
            isAnimating: false,
        };
    }

    componentDidUpdate(){
        if(this.state.isAnimating){
            setTimeout(() => this.setState({isAnimating: false}), 500);
        }
    }

    /**
     * to show counter
     */
    show(){
        this.setState({
            showArrows: true,
        });
    }

    /**
     * to hide counter
     */
    hide(){
        this.setState({
            showArrows: false,
        });
    }

    /**
     * to decrease counter
     */
    decreaseIndex(){
        const {setCurrentIndex, index, loopLength} = this.props;
        let {completeValue} = this.props;
        completeValue[index]--;
        let newIndex = 0;
        for(let i = 0; i < completeValue.length - 1; i++){
            newIndex += (completeValue[i] - 1) * CFields.getMultiplication(loopLength, i);
        }
        newIndex += completeValue[completeValue.length - 1] - 1;
        this.slider.slickPrev();
        this.setState({
            isAnimating: true,
        });
        setTimeout(() => setCurrentIndex(newIndex), 500);
    }

    /**
     * to increase counter
     */
    increaseIndex(){
        const {setCurrentIndex, index, loopLength} = this.props;
        let {completeValue} = this.props;
        completeValue[index]++;
        let newIndex = 0;
        for(let i = 0; i < completeValue.length - 1; i++){
            newIndex += (completeValue[i] - 1) * CFields.getMultiplication(loopLength, i);
        }
        newIndex += completeValue[completeValue.length - 1] - 1;
        this.slider.slickNext();
        this.setState({
            isAnimating: true,
        });
        setTimeout(() => setCurrentIndex(newIndex), 500);
    }

    renderValue(){
        const {loopLength, index} = this.props;
        let result = [];
        for(let i = 0; i < loopLength[index]; i++){
            result.push(<span key={i}>{i + 1}</span>);
        }
        return result;
    }

    render(){
        const {showArrows, isAnimating} = this.state;
        const {value, loopLength, index} = this.props;
        const isDisabledPrev = value === '1' || isAnimating;
        const isDisabledNext = value > loopLength[index] - 1 || isAnimating;

        const sliderSettings = {
            vertical: true,
            slidesToShow: 1,
            slidesToScroll: 1,
            infinite: false,
            dots: false,
            speed: 500,
            arrows: false,
            initialSlide: parseInt(value) - 1,
        };
        return(
            <div style={{display: 'inline-block',padding: '15px 0'}} onMouseOver={::this.show} onMouseLeave={::this.hide}>
                <div className={styles.counter_value} style={{maxWidth: `${20 + (value.length - 2) * 5}px`}}>
                    {showArrows ? <TooltipFontIcon className={`${styles.counter_up} ${isDisabledPrev ? styles.disabled_arrow : ''}`} onClick={isDisabledPrev ? null : ::this.decreaseIndex} tooltip={'Previous'} value={'keyboard_arrow_up'}/> : null}

                    <Slider ref={c => (this.slider = c)}  {...sliderSettings}>
                        {this.renderValue()}
                    </Slider>
                    {showArrows ? <TooltipFontIcon className={`${styles.counter_down} ${isDisabledNext ? styles.disabled_arrow : ''}`} onClick={isDisabledNext ? null : ::this.increaseIndex} tooltip={'Next'} value={'keyboard_arrow_down'}/> : null}
                </div>
            </div>
        );
    }
}

export default Counter;
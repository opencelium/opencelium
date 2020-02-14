/*
 * Copyright (C) <2019>  <becon GmbH>
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


/**
 * (not used) do delay before unmount the component
 *
 * @param Component
 */
export default function delayUnmounting(Component) {
    return class extends Component {
        constructor(props){
            super(props);
            this.state = {
                shouldRender: this.props.isMounted
            };
        }

        componentDidUpdate(prevProps) {
            if (prevProps.isMounted && !this.props.isMounted) {
                const {currentStyle, newStyle, id} = prevProps;
                const elem = document.getElementById(id);
                if(elem) {
                    elem.classList.remove(currentStyle);
                    elem.classList.add(newStyle);
                }
                setTimeout(
                    () => this.setState({ shouldRender: false }),
                    this.props.delayTime
                );
            } else if (!prevProps.isMounted && this.props.isMounted) {
                this.setState({ shouldRender: true });
            }
        }

        render() {
            let {currentStyle, newStyle, delayTime, isMounted, ...props} = this.props;
            return this.state.shouldRender ? <Component {...props} /> : null;
        }
    };
}
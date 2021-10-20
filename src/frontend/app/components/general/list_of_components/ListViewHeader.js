import React from 'react';
import PropTypes from "prop-types";
import Checkbox from "@basic_components/inputs/Checkbox";
import styles from "@themes/default/content/schedules/schedules";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";

class ListViewHeader extends React.Component{
    constructor(props) {
        super(props);
    }

    onCheckAll(){
        this.props.onCheckAll(this.props.setChecks);
    }

    render(){
        const {header, allChecked, sortType, toggleSortType, readOnly} = this.props;
        const sortTooltip = sortType === 'asc' ? 'Asc' : 'Desc';
        const sortValue = sortType === 'asc' ? 'keyboard_arrow_up' : 'keyboard_arrow_down';
        const isCheckboxesVisible = !readOnly;
        const isActionsVisible = !readOnly;
        return(
            <thead>
                <tr>
                    {isCheckboxesVisible &&
                        <th style={{width: '50px'}}>
                            <Checkbox
                                id='input_check_all'
                                checked={allChecked}
                                onChange={::this.onCheckAll}
                                labelClassName={styles.checkbox_label}
                                inputClassName={styles.checkbox_field}
                            />
                        </th>
                    }
                    {header.map(item => {
                        const hasNoColumn = item.value === 'id' || item.visible === false;
                        let style = item.hasOwnProperty('style') ? {...item.style} : null;
                        if(item.width){
                            if(!style){
                                style = {};
                            }
                            style.width = item.width;
                        }
                        return hasNoColumn ? null :
                            <th key={item.value} style={style}
                                title={item.label}>
                                {item.label}
                                {(item.value === 'name' || item.value === 'title') && <TooltipFontIcon isButton={true} blueTheme tooltip={sortTooltip} value={sortValue} onClick={toggleSortType}/>}
                            </th>
                    })}
                    {isActionsVisible &&
                        <th>Actions</th>
                    }
                </tr>
            </thead>
        );
    }
}

ListViewHeader.propTypes = {
    header: PropTypes.array.isRequired,
    readOnly: PropTypes.bool,
}

ListViewHeader.defaulProps = {
    readOnly: false,
}

export default ListViewHeader;
import React from 'react';
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";

class ListViewItem extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {item} = this.props;
        return(
            <tr>
                {item.map((value) => <td>{value}</td>)}
                <td>
                    <TooltipFontIcon tooltip={'View'} value={'visibility'} isButton={true} turquoiseTheme/>
                    <TooltipFontIcon tooltip={'Edit'} value={'edit'} isButton={true} turquoiseTheme/>
                    <TooltipFontIcon tooltip={'Delete'} value={'delete'} isButton={true} turquoiseTheme/>
                </td>
            </tr>
        );
    }
}

export default ListViewItem;
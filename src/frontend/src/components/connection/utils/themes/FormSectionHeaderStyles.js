export const FormSectionHeaderStyles = (theme) => {
    let styles = {
        backgroundColor: '#00ACC2',
    };
    if(theme === 'other'){
        styles.backgroundColor = '#c24c00';
    }
    return styles;
};
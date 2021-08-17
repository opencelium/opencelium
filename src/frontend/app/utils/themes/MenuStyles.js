export const MenuStyle = (theme) => {
    let styles = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '95px',
        height: '100vh',
        backgroundColor: '#012E55',
        color: '#eee',
        padding: '1.5rem 1.5rem 2rem',
        transition: '.5s',
        zIndex: 1000,
    };
    if(theme === 'other'){
        styles.backgroundColor = '#01553d';
    }
    return styles;
};
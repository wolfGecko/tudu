import React from 'react';
// MUI components and styles
import Snackbar from '@material-ui/core/Snackbar';import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
// MUI icons
import CloseIcon from '@material-ui/icons/Close';

export function SnackbarHandler(props) {

    const snackBar = () => {
        return <Snackbar
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            open={props.data.open}
            autoHideDuration={6000}
            onClose={props.onClose}
            message={props.data.message}
            key={props.data.key}
            ContentProps={{ "aria-describedby": "message-id", className: props.data.className }}
            action={
                <>
                    { props.data.displayUndoBtn === true &&
                        <Button color="secondary" size="small" onClick={props.data.undoFunction}>
                            UNDO
                        </Button>
                    }
                    <IconButton size="small" aria-label="close" color="inherit" onClick={props.onClose}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </>
            }
        />
    }

    return snackBar()
}

export default SnackbarHandler;
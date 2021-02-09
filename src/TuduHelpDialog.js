import React, { useState, forwardRef } from 'react';
// mui components
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Slide from '@material-ui/core/Slide';
import IconButton from '@material-ui/core/IconButton';
import Link from '@material-ui/core/Link';
// mui icons
import HelpIcon from '@material-ui/icons/Help';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import DragHandleIcon from '@material-ui/icons/DragHandle';
import DeleteIcon from '@material-ui/icons/Delete';
import Brightness4Icon from '@material-ui/icons/Brightness4';
import BrightnessHighIcon from '@material-ui/icons/BrightnessHigh';
import TextFieldsIcon from '@material-ui/icons/TextFields';


const Transition = forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function TuduHelpDialog(props) {
    const [open, setOpen] = useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleFullScreen = () => {
        if (window.innerWidth < 501) return true;
        else return false;
    }

    return (
        <>
            <IconButton onClick={handleClickOpen} className="help" aria-label="help"><HelpIcon fontSize="small" /></IconButton>
            <Dialog
                open={open}
                TransitionComponent={Transition}
                fullScreen={handleFullScreen()}
                onClose={handleClose}
                aria-labelledby="help-dialog-title"
                aria-describedby="help-dialog-body"
            >
                <DialogTitle id="help-dialog-title">Need a hand?</DialogTitle>
                <DialogContent id="help-dialog-body">
                    Welcome to Tudu, the Stupid Simple Todo List (Web) App. I try to be as intuitive as possible, but just in case, here is everything I can do:
                    <ul className={props.useDarkTheme ? "help-operations" : "help-operations light"}>
                        <li><CheckBoxOutlineBlankIcon />Mark item as complete</li>
                        <li><TextFieldsIcon />Click the text of an incomplete item to edit it</li>
                        <li><CheckBoxIcon color="primary" />Mark item as incomplete</li>
                        <li><DragHandleIcon />Click and drag to reorder</li>
                        <li><DeleteIcon />Delete item</li>
                        <li>{props.useDarkTheme ? <BrightnessHighIcon color="primary" /> : <Brightness4Icon color="primary" />}Toggle dark theme</li>
                        <li><Button variant="outlined" color="primary" size="small">Archive</Button>Move completed items to the archive</li>
                    </ul>
                    <div className="contact">
                        What to help me improve?
                        <br />
                        Send your suggestions to: <Link href="mailto:contact@tudu.anonaddy.com" color="primary">contact@tudu.anonaddy.com</Link>
                        <br />
                        v 2.0.1
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="primary">Close</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

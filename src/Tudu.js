import React, { useState } from 'react';
// undo
import useUndo from 'use-undo';
// sortable
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import arrayMove from 'array-move';
// UI components and styles
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Snackbar from '@material-ui/core/Snackbar';
// icons
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import CloseIcon from '@material-ui/icons/Close';
import DragHandleIcon from '@material-ui/icons/DragHandle';
// stylesheets
import './Tudu.css';
// functions
import { idMaker, displayPrettyDate, getSuccessMessage } from './functions';

const useStyles = makeStyles((theme) => ({
    root: {
        '& > *': {
            margin: theme.spacing(1),
            width: '25ch',
        },
    },
    successSnackbar: { backgroundColor: '#4caf50'}
}));

export function Tudu() {
    const classes = useStyles();
    const [newItem, setNewItem] = useState('');
    const [items, { set: setItems, undo: undoItems }] = useUndo([
        { complete: false, id: "PMVyujwET", name: "What" },
        { complete: false, id: "ZaDwlCO4q", name: "It" },
        { complete: false, id: "blM6fC67H", name: "Do?" }
    ]);
    const { present: presentItems } = items;
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarKey, setSnackbarKey] = useState('');

    const addNewItem = e => {
        e.preventDefault();
        if (newItem.length > 0) {
            let newItemData = { 'complete': false };
            newItemData.name = newItem;
            newItemData.id = idMaker(9);
            let newItems = [...presentItems];
            newItems.push(newItemData);
            setItems(newItems);
            setNewItem('');
        }
    }

    const DragHandle = SortableHandle(() => <IconButton aria-label="edit"><DragHandleIcon fontSize="small" /></IconButton>);

    const SortableItem = SortableElement(({ item }) => {
        return (
            <div key={item.id} className={item.complete ? 'item complete' : 'item'}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={item.complete}
                            onChange={() => handleCheck(item.id)}
                            name={item.name}
                            color="primary"
                        />
                    }
                    label={item.name}
                />
                <span className="item-icons">
                    <DragHandle />
                    <IconButton aria-label="delete" onClick={() => deleteItem(item.id)}><DeleteIcon fontSize="small" /></IconButton>
                </span>
            </div>
        );
    });

    const SortableList = SortableContainer(({ items }) => {
        return (
            <div className="items">
                {items.map((item, index) => (
                    <SortableItem key={item.id} item={item} index={index} />
                ))}
            </div>
        );
    });

    const handleSnackbar = (open, type, key) => {
        if (type === 'success') setSnackbarMessage(getSuccessMessage());
        if (type === 'undo') setSnackbarMessage('undo');
        setSnackbarKey(key);
        setSnackbarOpen(open);
    }

    const handleSortEnd = ({ oldIndex, newIndex }) => {
        let items = [...presentItems];
        let newItems = arrayMove(items, oldIndex, newIndex);
        setItems(newItems);
    }

    const deleteItem = id => {
        let index = presentItems.findIndex(item => item.id === id);
        let newItems = [...presentItems];
        newItems.splice(index, 1);
        setItems(newItems);
        handleSnackbar(true, 'undo', id);
    }

    const handleCheck = id => {
        // finds the index of the item with that id and toggle it's complete value. could use index directly from the items.map function that calls this function but it seems sketchy
        let index = presentItems.findIndex(item => item.id === id);
        let newItems = [...presentItems];
        if (newItems[index].complete === false) handleSnackbar(true, 'success', id);
        newItems[index].complete = !newItems[index].complete;
        setItems(newItems);
    }

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        handleSnackbar(false);
    }

    const handleUndoItems = () => {
        undoItems();
        handleSnackbar(false);
    }

    const snackBar = () => {
        let message;
        let undo;
        let className;
        if (snackbarMessage === 'undo') {
            message = 'Item Deleted';
            undo = true;
        }
        else {
            undo = false;
            className = classes.successSnackbar;
            message = snackbarMessage;
        }
        return <Snackbar
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
            message={message}
            key={snackbarKey + snackbarMessage}
            ContentProps={{"aria-describedby": "message-id", className: className}}
            action={
                <>
                    { undo === true &&
                        <Button color="secondary" size="small" onClick={handleUndoItems}>
                            UNDO
                        </Button>
                    }
                    <IconButton size="small" aria-label="close" color="inherit" onClick={handleCloseSnackbar}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </>
            }
        />
    }

    return (
        <div className="bg">
            <div className="wrapper">
                <h1>Tudu</h1>
                <div className="title-line"></div>
                <h3>{displayPrettyDate(new Date())}</h3>
                <SortableList items={presentItems} useDragHandle={true} onSortEnd={handleSortEnd} />
                <form className={classes.root} noValidate autoComplete="off" onSubmit={addNewItem}>
                    <TextField label="New item" onChange={e => setNewItem(e.target.value)} value={newItem} />
                    <br />
                    <Button variant="contained" color="primary" type="submit">
                        Add Item
                    </Button>
                    <Button variant="outlined" color="primary">
                        View Archive
                    </Button>
                </form>
            </div>
            <div className="credit">Whipped up with ❤️ by Liam</div>
            {snackBar()}
        </div>
    );
}

export default Tudu;
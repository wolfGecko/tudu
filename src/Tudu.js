import React, { useState } from 'react';
// undo
import useUndo from 'use-undo';
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

const useStyles = makeStyles((theme) => ({
    root: {
        '& > *': {
            margin: theme.spacing(1),
            width: '25ch',
        },
    },
}));

const idMaker = () => {
    const chars = '0123456789qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM';
    let id = '';
    for (let i = 0; i < 9; i++) id += chars[Math.floor(Math.random() * chars.length)]
    return id;
}

function Tudu() {
    const classes = useStyles();
    const [newItem, setNewItem] = useState('');
    const [items, { set: setItems, undo: undoItems }] = useUndo([
        { complete: false, id: "PMVyujwET", name: "What" },
        { complete: false, id: "ZaDwlCO4q", name: "It" },
        { complete: false, id: "blM6fC67H", name: "Do?" }
    ]);
    const { present: presentItems } = items;
    const [undoBarOpen, setUndoBarOpen] = useState(false);

    const addNewItem = e => {
        e.preventDefault();
        if (newItem.length > 0) {
            let newItemData = { 'complete': false };
            newItemData.name = newItem;
            newItemData.id = idMaker();
            let newItems = [...presentItems];
            newItems.push(newItemData);
            setItems(newItems);
            setNewItem('');
        }
    }

    const deleteItem = id => {
        let index = presentItems.findIndex(item => item.id === id);
        let newItems = [...presentItems];
        newItems.splice(index, 1);
        setItems(newItems);
        setUndoBarOpen(true);
    }

    const handleItems = () => {
        return (
            <div className="items">
                {presentItems.map(item => {
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
                                <IconButton aria-label="edit"><DragHandleIcon fontSize="small" /></IconButton>
                                <IconButton aria-label="delete" onClick={() => deleteItem(item.id)}><DeleteIcon fontSize="small" /></IconButton>
                            </span>
                        </div>
                    )
                })}
            </div>
        );
    }

    const handleCheck = id => {
        // finds the index of the item with that id and toggle it's complete value. could use index directly from the items.map function that calls this function but it seems sketchy
        let index = presentItems.findIndex(item => item.id === id);
        let newItems = [...presentItems];
        newItems[index].complete = !newItems[index].complete;
        setItems(newItems);
        console.log(newItems)
    }

    const handleCloseUndoBar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setUndoBarOpen(false);
    }

    const handleUndoItems = () => {
        undoItems();
        setUndoBarOpen(false);
    }

    const undoSnackbar = () => {
        return <Snackbar
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            open={undoBarOpen}
            autoHideDuration={6000}
            onClose={handleCloseUndoBar}
            message="Item Deleted"
            action={
                <>
                    <Button color="secondary" size="small" onClick={handleUndoItems}>
                        UNDO
                    </Button>
                    <IconButton size="small" aria-label="close" color="inherit" onClick={handleCloseUndoBar}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </>
            }
        />
    }

    const displayDate = () => {
        var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        var today = new Date();
        return today.toLocaleDateString("en-US", options);
    }

    return (
        <div className="bg">
            <div className="wrapper">
                <h1>Tudu</h1>
                <h2>Stupid Simple Todo List</h2>
                <h3>{displayDate()}</h3>
                {handleItems()}
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
            {undoSnackbar()}
        </div>
    );
}

export default Tudu;
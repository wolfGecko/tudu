import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
// UI components
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
// icons
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Create';

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
    const [items, setItems] = useState([
        {complete: false, id: "PMVyujwET", name: "What"},
        {complete: false, id: "ZaDwlCO4q", name: "It"},
        {complete: false, id: "blM6fC67H", name: "Do?"}
      ]);

    const addNewItem = e => {
        e.preventDefault();
        if (newItem.length > 0) {
            let newItemData = { 'complete': false };
            newItemData.name = newItem;
            newItemData.id = idMaker();
            setItems(items => [...items, newItemData]);
            setNewItem('');
        }
    }

    const deleteItem = id => {
        let index = items.findIndex(item => item.id === id);
        let newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    }
    
    const handleItems = () => {
        return (
            <div className="items">
                {items.map(item => {
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
                                <IconButton aria-label="edit"><EditIcon fontSize="small" /></IconButton>
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
        let index = items.findIndex(item => item.id === id);
        let newItems = [...items];
        newItems[index].complete = !newItems[index].complete;
        setItems(newItems);
    }

    return (
        <div className="bg">
            <div className="wrapper">
                <h1>Tudu</h1>
                <h2>Stupid Simple Todo List App</h2>
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
        </div>
    );
}

export default Tudu;
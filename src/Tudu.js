import React, { useEffect, useRef, useState } from 'react';
// internal
import TuduArchive from './TuduArchive';
import SnackbarHandler from './SnackbarHandler';
// undo
import useUndo from 'use-undo';
// sortable
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import arrayMove from 'array-move';
// MUI components and styles
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
// MUI icons
import DeleteIcon from '@material-ui/icons/Delete';
import DragHandleIcon from '@material-ui/icons/DragHandle';
// stylesheets
import './Tudu.css';
// functions
import { idMaker, displayPrettyDate, getSuccessMessage } from './functions';

const useStyles = makeStyles((theme) => ({
    root: {
        '& > *': {
            margin: theme.spacing(1),
            // width: '25ch',
        },
    },
}));

export function Tudu() {
    const classes = useStyles();
    const [items, { set: setItems, undo: undoItems }] = useUndo([]);
    const { present: presentItems } = items;
    // const [newItem, setNewItem] = useState('');
    const [snackbarData, setSnackbarData] = useState({
        className: '',
        displayUndoBtn: true,
        key: '',
        message: '',
        open: false,
        undoFunction: ''
    });
    const [anyCompleted, setAnyCompleted] = useState(false);
    const [displayArchive, setDisplayArchive] = useState(false);
    const [requestCloseArchive, setRequestCloseArchive] = useState(false);

    const itemInput = useRef();

    const db = useRef(null);

    useEffect(() => {
        // create indexedDB for client side storage if not already there and read any current data
        // console.log('init DB and read hook')
        // calls the databaseOpen function below
        databaseOpen(() => {
            // callback to read data
            const transaction = db.current.transaction(['activeTodos'], 'readonly');
            const store = transaction.objectStore('activeTodos');
            const req = store.get(1);
            req.onsuccess = function (e) {
                const result = e.target.result;
                if (result) setItems(result.data);
            };
        });

        function databaseOpen(callback) {
            // Open a database, specify the name and version (version must be incremented to update the db stucture)
            const version = 1;
            const request = indexedDB.open('tuduApp', version);
            // Run migrations if necessary
            request.onupgradeneeded = function (e) {
                db.current = e.target.result;
                e.target.transaction.onerror = databaseError;
                db.current.createObjectStore('activeTodos', { keyPath: 'id' });
                let archiveStore = db.current.createObjectStore('archiveTodos', { keyPath: 'id' });
                archiveStore.createIndex('date', 'date', { unique: false });
            };
            request.onsuccess = function (e) {
                db.current = e.target.result;
                callback();
            };
            request.onerror = databaseError;
        }

        function databaseError(e) { console.error('An IndexedDB error has occurred', e); }
    }, [setItems]);

    useEffect(() => {
        // this hook tracks any changes to items, aka the activeTodos
        // updates the single record in the db. this is the items.present array. Pro: this method captures all changes. Con: all the data is in one record, performance may suffer if there are many tasks. 
        if (db.current) databaseUpdateActiveTodos(items.present);
        function databaseUpdateActiveTodos(data) {
            const transaction = db.current.transaction(['activeTodos'], 'readwrite');
            const store = transaction.objectStore('activeTodos');
            const request = store.put({
                data: data,
                id: 1
            });
            // transaction.oncomplete = function (e) { console.log('data added') };
            request.onerror = e => console.error('An IndexedDB error has occurred', e);
        }

        // find if any tasks are completed to toggle disable on archive button
        let anyCompleted = false;
        for (let i = 0; i < items.present.length; i++) {
            if (items.present[i].complete === true) {
                anyCompleted = true;
                break;
            }
        }
        setAnyCompleted(anyCompleted);
    }, [items]);

    const addNewItem = e => {
        e.preventDefault();
        let devName = itemInput.current.children[1].children[0].value;
        // console.log(devName);
        if (devName.length > 0) {
            let newItemData = { 'complete': false, 'completedTime': 0 };
            newItemData.name = devName;
            newItemData.id = idMaker(9);
            let newItems = [...presentItems];
            newItems.push(newItemData);
            setItems(newItems);
            itemInput.current.children[1].children[0].value = '';
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

    const handleSnackbar = (open, className, displayUndoBtn, key, message, undoFunction) => {
        setSnackbarData({
            className,
            displayUndoBtn,
            key,
            message,
            open,
            undoFunction,
        });
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
        handleSnackbar(true, '', true, id, 'Item Deleted', handleUndoItems);
    }

    const handleCheck = id => {
        // finds the index of the item with that id and toggle it's complete value. could use index directly from the items.map function that calls this function but it seems sketchy
        let index = presentItems.findIndex(item => item.id === id);
        let newItems = [...presentItems];
        const now = Date.now();
        if (newItems[index].complete === false) {
            handleSnackbar(true, 'success-snackbar', false, id + now, getSuccessMessage(), '');
            newItems[index].completedTime = now;
        } else {
            newItems[index].completedTime = 0;
        }
        newItems[index].complete = !newItems[index].complete;
        setItems(newItems);
    }

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        handleSnackbar(false, '', true, '', '', '');
    }

    const handleUndoItems = () => {
        undoItems();
        handleSnackbar(false, '', true, '', '', '');
    }

    const handleArchive = () => {
        // this archives checked items
        // it closes the archive if open so that newly archived items will appear when it is reopened
        if (displayArchive === true) handleDisplayArchive();
        let toArchive = [];
        let toActive = [];
        items.present.forEach(item => {
            if (item.complete === true) toArchive.push(item);
            else toActive.push(item);
        });
        databaseArchiveTodos(toArchive);
        setItems(toActive);
    }

    const databaseArchiveTodos = toArchive => {
        const transaction = db.current.transaction(['archiveTodos'], 'readwrite');
        const store = transaction.objectStore('archiveTodos');
        toArchive.forEach(item => {
            const request = store.put({
                id: item.id,
                name: item.name,
                date: new Date(item.completedTime),
                timeStamp: item.completedTime
            });
            transaction.oncomplete = function (e) {
                handleSnackbar(true, '', true, toArchive[0].id, `${toArchive.length} Item(s) Archived`, () => handleUndoArchive(toArchive));
            };
            request.onerror = e => console.error('An IndexedDB error has occurred', e);;
        });
    }

    const handleUndoArchive = fromArchive => {
        const transaction = db.current.transaction(['archiveTodos'], 'readwrite');
        const store = transaction.objectStore('archiveTodos');
        fromArchive.forEach(item => {
            const request = store.delete(item.id);
            transaction.oncomplete = function (e) { console.log('records removed from archive') };
            request.onerror = e => console.error('An IndexedDB error has occurred', e);;
        });
        undoItems();
        handleSnackbar(false, '', true, '', '', '');
    }

    const handleDisplayArchive = () => {
        if (displayArchive === false) {
            setDisplayArchive(true);
            handleSnackbar(false, '', true, '', '', '');
        }
        if (displayArchive === true) {
            // passes a prop to animate out before a callback unmounts 
            setRequestCloseArchive(true);
        }
    }

    return (
        <div className="bg">
            <div className="wrapper">
                <h1>Tudu</h1>
                <div className="title-line"></div>
                {displayArchive === true &&
                    <TuduArchive db={db.current} handleSnackbar={handleSnackbar} requestCloseArchive={requestCloseArchive} closeArchiveCallback={() => { setDisplayArchive(false); setRequestCloseArchive(false) }} />
                }
                <h3>{displayPrettyDate(new Date())}</h3>
                <SortableList items={presentItems} useDragHandle={true} onSortEnd={handleSortEnd} />
                <form className={classes.root} noValidate autoComplete="off" onSubmit={addNewItem}>
                    <TextField label="New item" ref={itemInput} />
                    {/* <TextField label="New item" onChange={e => setNewItem(e.target.value)} value={target.value} /> */}
                    <br />
                    <Button variant="contained" disableElevation={true} color="primary" type="submit">Add Item</Button>
                    <ButtonGroup variant="outlined" color="primary" aria-label="large outlined primary button group">
                        <Button disabled={!anyCompleted} onClick={handleArchive}>Archive</Button>
                        <Button onClick={handleDisplayArchive}>{displayArchive ? 'Hide Archive' : 'View Archive'}</Button>
                    </ButtonGroup>
                </form>
            </div>
            <div className="credit">🖥️ by Liam</div>
            <SnackbarHandler data={snackbarData} onClose={handleCloseSnackbar} />
        </div>
    );
}

export default Tudu;
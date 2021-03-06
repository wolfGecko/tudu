import React, { useEffect, useRef, useState } from 'react';
// internal
import TuduArchive from './TuduArchive';
import TuduHelpDialog from './TuduHelpDialog';
import SnackbarHandler from './SnackbarHandler';
// undo
import useUndo from 'use-undo';
// sortable
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import arrayMove from 'array-move';
// MUI components and styles
import { makeStyles, createMuiTheme } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/styles';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import TextField from '@material-ui/core/TextField';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import Link from '@material-ui/core/Link';
// MUI icons
import DeleteIcon from '@material-ui/icons/Delete';
import DragHandleIcon from '@material-ui/icons/DragHandle';
import Brightness4Icon from '@material-ui/icons/Brightness4';
import BrightnessHighIcon from '@material-ui/icons/BrightnessHigh';
// stylesheets
import './Tudu.css';
// functions
import { idMaker, displayPrettyDate, getSuccessMessage } from './functions';

const localStorage = window.localStorage;
const orangeTheme = '#aa4415';
const blueTheme = '#3f51b5';
const metaThemeColor = document.querySelector("meta[name=theme-color]");

const darkTheme = createMuiTheme({
    palette: {
        type: 'dark',
        primary: {
            main: '#f4621e',
        },
    },
});

const lightTheme = createMuiTheme({
    palette: {
        type: 'light',
    },
});

const useStyles = makeStyles((theme) => ({
    root: {
        '& > *': {
            margin: theme.spacing(1),
        }
    },
}));

const DragHandle = SortableHandle(() => <IconButton className="draghandle" aria-label="reorder"><DragHandleIcon fontSize="small" /></IconButton>);

const SortableItem = SortableElement(({ item, handleCheck, handleEdit, deleteItem }) => {
    return (
        <div key={item.id} className={item.complete ? 'item complete active' : 'item active'}>
            <Checkbox
                id={item.id}
                checked={item.complete}
                onChange={() => handleCheck(item.id)}
                name={item.name}
                color="primary"
            />
            <span key={item.id} contentEditable={item.complete ? false : true} onBlur={(e) => handleEdit(e, item.id)} suppressContentEditableWarning={true} onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur() }}>{item.name}</span>
            <span className="item-icons">
                <DragHandle />
                <IconButton aria-label="delete" onClick={() => deleteItem(item.id)}><DeleteIcon fontSize="small" /></IconButton>
            </span>
        </div>
    );
});

const SortableList = SortableContainer(({ items, handleCheck, handleEdit, deleteItem }) => {
    return (
        <div className="items">
            {items.map((item, index) => (
                <SortableItem key={item.id} item={item} index={index} handleCheck={handleCheck} handleEdit={handleEdit} deleteItem={deleteItem} />
            ))}
        </div>
    );
});

export function Tudu() {
    const classes = useStyles();
    const [items, { set: setItems, undo: undoItems }] = useUndo([]);
    const { present: presentItems } = items;
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
    const initialTheme = () => (localStorage.getItem('useDarkTheme') === 'true' || localStorage.getItem('useDarkTheme') === true) ? true : false;
    const [useDarkTheme, setUseDarkTheme] = useState(initialTheme());

    const itemInput = useRef();

    const db = useRef(null);

    useEffect(() => {
        // set the theme color to orange for dark mode loading
        if (localStorage.getItem('useDarkTheme') === 'true' || localStorage.getItem('useDarkTheme') === true) metaThemeColor.setAttribute("content", orangeTheme);
    }, []);

    useEffect(() => {
        // create indexedDB for client side storage if not already there and read any current data
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
        const input = itemInput.current.children[1].children[0];
        let itemName = input.value;
        if (itemName.length === 0) input.focus();
        if (itemName.length > 0) {
            let newItemData = { 'complete': false, 'completedTime': 0 };
            newItemData.name = itemName;
            newItemData.id = idMaker(9);
            let newItems = [...presentItems];
            newItems.push(newItemData);
            setItems(newItems);
            input.value = '';
        }
    }

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

    const handleEdit = (e, id) => {
        // finds the index of the item with that id and toggle it's complete value. could use index directly from the items.map function that calls this function but it seems sketchy
        let index = presentItems.findIndex(item => item.id === id);
        const newName = e.target.textContent;
        let newItems = [...presentItems];
        newItems[index].name = newName;
        setItems(newItems);
    }

    const handleSortEnd = ({ oldIndex, newIndex }) => {
        let items = [...presentItems];
        let newItems = arrayMove(items, oldIndex, newIndex);
        setItems(newItems);
    }

    const deleteItem = id => {
        // finds the index of the item with that id and toggle it's complete value. could use index directly from the items.map function that calls this function but it seems sketchy
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

    const toggleDarkTheme = () => {
        localStorage.setItem('useDarkTheme', !useDarkTheme);
        metaThemeColor.setAttribute("content", useDarkTheme ? blueTheme : orangeTheme);
        setUseDarkTheme(!useDarkTheme);
    }

    return (
        <ThemeProvider theme={useDarkTheme ? darkTheme : lightTheme}>
            <div className={useDarkTheme ? "bg dark" : "bg"}>
                <div className="wrapper">
                    <span className="top-right-btns">
                        <TuduHelpDialog useDarkTheme={useDarkTheme} />
                        <IconButton aria-label="darktheme" color="primary" className="dark-theme-toggle" onClick={toggleDarkTheme}>
                            {!useDarkTheme && <Brightness4Icon fontSize="small" />}
                            {useDarkTheme && <BrightnessHighIcon fontSize="small" />}
                        </IconButton>
                    </span>
                    <h1>Tudu</h1>
                    <div className="title-line"></div>
                    {displayArchive === true &&
                        <TuduArchive db={db.current} handleSnackbar={handleSnackbar} requestCloseArchive={requestCloseArchive} closeArchiveCallback={() => { setDisplayArchive(false); setRequestCloseArchive(false) }} />
                    }
                    <h3>{displayPrettyDate(new Date())}</h3>
                    <SortableList helperClass={useDarkTheme ? "dark" : ""} items={presentItems} useDragHandle={true} handleCheck={handleCheck} handleEdit={handleEdit} deleteItem={deleteItem} onSortEnd={handleSortEnd} />
                    <form className={classes.root} noValidate autoComplete="off" onSubmit={addNewItem}>
                        <TextField label="New item" ref={itemInput} />
                        <br />
                        <Button variant="contained" disableElevation={true} color="primary" type="submit">Add Item</Button>
                        <ButtonGroup variant="outlined" color="primary" aria-label="large outlined primary button group">
                            <Button disabled={!anyCompleted} onClick={handleArchive}>Archive</Button>
                            <Button onClick={handleDisplayArchive}>{displayArchive ? 'Hide Archive' : 'View Archive'}</Button>
                        </ButtonGroup>
                    </form>
                </div>
                <div className="credit">🖥️ by <Link href="https://liaminnis.com" color="primary" target="_blank" rel="noopener noreferrer">Liam</Link></div>
                <SnackbarHandler data={snackbarData} onClose={handleCloseSnackbar} />
            </div>
        </ThemeProvider>
    );
}

export default Tudu;
import React, { useEffect, useState } from 'react';
// undo
import useUndo from 'use-undo';
// MUI components and styles
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Snackbar from '@material-ui/core/Snackbar';
// MUI icons
import DeleteIcon from '@material-ui/icons/Delete';
import CloseIcon from '@material-ui/icons/Close';

// stylesheet
import './Tudu.css';

export function TuduArchive(props) {
    const [items, { set: setItems, undo: undoItems }] = useUndo([]);
    const { present: presentItems } = items;
    const [itemsLoaded, setItemsLoaded] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [deletedItem, setDeletedItem] = useState({});
    const db = props.db;
    
    useEffect(() => {
        console.log('archive effect')
        // resets the itemsLoaded Boolean causing a reload everytime archive is opened
        if (props.open === false && itemsLoaded === true) {
            setItemsLoaded(false);
        } 
    }, [props.open, items, itemsLoaded]);

    const readArchive = () => {
        if (db) {
            const transaction = db.transaction(['archiveTodos'], 'readonly');
            const store = transaction.objectStore('archiveTodos');
            const index = store.index('date');
            const req = index.openCursor();
            let updatedItems = [];
            req.onsuccess = function (e) {
                let cursor = e.target.result;
                if (cursor) {
                    updatedItems.push(cursor.value);
                    cursor.continue();
                } else {
                    setItems(updatedItems);
                    setItemsLoaded(true);
                    props.loadedCallback();
                }
            }
        }
    }

    if (props.requestLoad === true && itemsLoaded === false) {
        readArchive();
    }

    const deleteItem = item => {
        // delete item from store
        const transaction = db.transaction(['archiveTodos'], 'readwrite');
        const store = transaction.objectStore('archiveTodos');
        const req = store.delete(item.id);
        req.onerror = err => { console.log('error', err) };

        // remove item from state / display
        let updatedItems = [...presentItems];
        for (let i = 0; i < presentItems.length; i++) {
            if (updatedItems[i].id === item.id) {
                updatedItems.splice(i, 1);
                break;
            }
        }
        setItems(updatedItems);
        setDeletedItem(item);
        setSnackbarOpen(true);
    }

    const displayItems = () => {
        return presentItems.map(item => (
            <div key={item.id} className={'item archive'}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={true}
                            disabled={true}
                            name={item.name}
                        />
                    }
                    label={item.name}
                />
                <span className="item-icons">
                    <IconButton aria-label="delete" onClick={() => deleteItem(item)}><DeleteIcon fontSize="small" /></IconButton>
                </span>
            </div>
        ))
    }

    const handleUndoDelete = () => {
        setSnackbarOpen(false);
        const transaction = db.transaction(['archiveTodos'], 'readwrite');
        const store = transaction.objectStore('archiveTodos');
        const req = store.put({
            id: deletedItem.id,
            date: deletedItem.date,
            name: deletedItem.name,
            timeStamp: deletedItem.timeStamp
        });
        req.onerror = e => console.error('An IndexedDB error has occurred', e);
        req.oncomplete = () => { setDeletedItem({}) };
        undoItems();
    }

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    }

    const snackBar = () => {
        return <Snackbar
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
            message="Item Permanently Deleted"
            key={deletedItem ? deletedItem.id : ''}
            action={
                <>
                    <Button color="secondary" size="small" onClick={handleUndoDelete}>
                        UNDO
                        </Button>
                    <IconButton size="small" aria-label="close" color="inherit" onClick={handleCloseSnackbar}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </>
            }
        />
    }

    return (
        <div className="items-archive">
            {displayItems()}
            {snackBar()}
        </div>
    )
}

export default TuduArchive;
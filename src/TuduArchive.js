import React, { useEffect, useState } from 'react';
// undo
import useUndo from 'use-undo';
// MUI components and styles
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import Collapse from '@material-ui/core/Collapse';
import LinearProgress from '@material-ui/core/LinearProgress';
// MUI icons
import DeleteIcon from '@material-ui/icons/Delete';

// stylesheet
import './Tudu.css';

export function TuduArchive(props) {
    const [items, { set: setItems, undo: undoItems }] = useUndo([]);
    const { present: presentItems } = items;
    const [itemsLoaded, setItemsLoaded] = useState(false);
    const db = props.db;

    useEffect(() => {
        // read archive
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
                }
            }
        }
    }, [db, setItems]);

    useEffect(() => {
        // closes archive after animate out. timeout is so that the transition completes before this comp is unmounted
        if (props.requestCloseArchive === true) {
            setItemsLoaded(false);
            setTimeout(() => { props.closeArchiveCallback() }, 400)
        }
    }, [props]);

    const handleDeleteItem = item => {
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
        props.handleSnackbar(true, '', true, item.id, 'Item Permanently Deleted', () => handleUndoDelete(item));
    }

    const handleUndoDelete = deletedItem => {
        // rewrites the item in the store and calls undoItems to restore the state
        // does this via the handleSnackbar callback function from Tudu
        props.handleSnackbar(false, '', true, '', '', '');
        const transaction = db.transaction(['archiveTodos'], 'readwrite');
        const store = transaction.objectStore('archiveTodos');
        const req = store.put({
            id: deletedItem.id,
            date: deletedItem.date,
            name: deletedItem.name,
            timeStamp: deletedItem.timeStamp
        });
        req.onerror = e => console.error('An IndexedDB error has occurred', e);
        // req.oncomplete = () => { setDeletedItem({}) };
        undoItems();
    }

    const displayItems = () => {
        return presentItems.map(item => (
            <div key={item.id} className="item archive">
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
                    <IconButton aria-label="delete" onClick={() => handleDeleteItem(item)}><DeleteIcon fontSize="small" /></IconButton>
                </span>
            </div>
        ))
    }

    return (
        <div className="items-archive">
            { itemsLoaded === false && props.requestCloseArchive === false &&
                <LinearProgress />
            }
            <Collapse in={itemsLoaded}>
                {displayItems()}
            </Collapse>
        </div>
    )
}

export default TuduArchive;
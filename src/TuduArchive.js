import React, { useState } from 'react';

// MUI components and styles
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
// MUI icons
import DeleteIcon from '@material-ui/icons/Delete';

// stylesheet
import './Tudu.css';

export function TuduArchive(props) {
    const [items, setItems] = useState([]);
    const [itemsLoaded, setItemsLoaded] = useState(false);

    const readArchive = () => {
        const db = props.db;
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
                }
            }
        }
    }

    if (props.open === true && itemsLoaded === false) {
        readArchive();
        setItemsLoaded(true);
        console.log('loadItems')
    }

    const deleteItem = id => {
        console.log(id)
    }

    const displayItems = () => {
        return items.map(item => (
            <div key={item.id} className={'item archive'}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={true}
                            // onChange={() => handleCheck(item.id)}
                            disabled={true}
                            name={item.name}
                        // color="default"
                        />
                    }
                    label={item.name}
                />
                <span className="item-icons">
                    <IconButton aria-label="delete" onClick={() => deleteItem(item.id)}><DeleteIcon fontSize="small" /></IconButton>
                </span>
            </div>
        ))
    }


    return (
        <div {...props} className="items-archive">{displayItems()}</div>
    )
}

export default TuduArchive;
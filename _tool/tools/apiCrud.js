const fs = require('fs');
const path = require('path');

const crudPath = path.join(__dirname, '../tooldata/crud.js');

const saveCrudData = (req, res) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const { categoryIndex, itemIndex, itemData, action } = JSON.parse(body);
            
            // 1. Get current data (bypass cache)
            if (require.cache[require.resolve(crudPath)]) {
                delete require.cache[require.resolve(crudPath)];
            }
            const currentData = require(crudPath);

            // 2. Modify data
            if (categoryIndex >= 0 && currentData[categoryIndex]) {
                if (action === 'delete') {
                    // Remove item
                    currentData[categoryIndex].items.splice(itemIndex, 1);
                } else if (action === 'add') {
                     // Add new item (itemData should be fully formed)
                     // If itemIndex is -1, push to end.
                     currentData[categoryIndex].items.push(itemData);
                } else {
                    // Update existing
                    if (itemIndex >= 0 && currentData[categoryIndex].items[itemIndex]) {
                         currentData[categoryIndex].items[itemIndex] = {
                             ...currentData[categoryIndex].items[itemIndex],
                             ...itemData
                         };
                    }
                }
            } else if (action === 'add_category') {
                currentData.push({ category: itemData.category, items: [] });
            } else if (action === 'rename_category') {
                 // Req body: { action: 'rename_category', categoryIndex: 0, newName: '...' }
                 const { newName } = JSON.parse(body);
                 if (currentData[categoryIndex]) {
                     currentData[categoryIndex].category = newName;
                 }
            } else if (action === 'delete_category') {
                 // Req body: { action: 'delete_category', categoryIndex: 0 }
                 if (currentData[categoryIndex]) {
                     currentData.splice(categoryIndex, 1);
                 }
            }

            // 3. Write back
            // We use simple JSON.stringify, but we need to assign it to variable 'crud'
            const fileContent = `const crud = ${JSON.stringify(currentData, null, 4)}\n\nmodule.exports = crud;`;
            fs.writeFileSync(crudPath, fileContent, 'utf8');

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));

        } catch (e) {
            console.error('Error saving CRUD data:', e);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: e.message }));
        }
    });
};

module.exports = {
    saveCrudData
};

/*
 * Specials API
 * /v1/specials
 * 
 * GET: /v1/specials
 * GET: /v1/specials/{id}
 * POST: /v1/specials
 * PUT: /v1/specials/{id}
 * DELETE: /v1/specials/{id}
 * 
 */

// Configure database for use throughout the API
const db = require('./db-connect.js'); // Path to our lambda layer at runtime

exports.lambdaHandler = async (event, context) => {
    try {

        /* 
         * Get parts and http method (remove bogus part of path)
         *
         * NOTE: Since we know this Lambda is only called from the
         * /v1/specials endpoint, we can assume it will always have
         * at least 2 parts.
         */
        const parts = event.path.split('/');
        const method = event.httpMethod;
        parts.shift();

        // Call appropriate function based on url and method
        if (method == 'GET' && parts.length == 2) {
            return await getAllSpecials(); // GET all specials
        } else if (method == 'GET' && parts.length == 3) {
            return await getSpecial(parts[2]); // GET individual special
        } else if (method == 'POST' && parts.length == 2) {
            return await addSpecial(event.body); // POST new special
        } else if (method == 'PUT' && parts.length == 3) {
            return await updateSpecial(parts[2], event.body); // UPDATE special
        } else if (method == 'DELETE' && parts.length == 3) {
            return await deleteSpecial(parts[2]); // DELETE special
        } else {
            return await response(400, 'Invalid url'); // Invalid url
        }

    } catch (err) {
        return await handleError(err);
    }
};

// ======================================================================= CRUD Methods

/*
 * GET: /v1/specials
 */
async function getAllSpecials() {
    try {
        console.log(`GET all specials called`);

        let result = await db.query(`select * from specials`);

        return await response(200, result);
    } catch (err) {
        return await handleError(err);
    }
}

/*
 * GET: /v1/specials/{id}
 */
async function getSpecial(id) {
    try {
        console.log(`GET special called (id: ${id})`);

        if (!id || isNaN(id))
            return await response(400, 'Invalid id');

        let result = await db.query(`SELECT * FROM specials WHERE specialId=?`, [id]);

        if (result == null || result[0] == null)
            return await response(404, 'Special with specified id does not exist.');

        return await response(200, result[0]);
    } catch (err) {
        console.log('ERROR getting special');
        return await handleError(err);
    }
}

/*
 * POST: /v1/specials
 */
async function addSpecial(body) {
    try {
        console.log(`POST special called`);        

        // Add special to DB
        let special = JSON.parse(body);

        let result = await db.query(`
            INSERT INTO specials(startTime, endTime, name, currentPrice, discountPrice, isActive, numAvailable) VALUES(?,?,?,?,?,?)
        `, [
            special.name,
            special.city,
            special.state,
            special.email,
            special.phone,
            special.zip            
        ]);

        console.log(`POST request completed successfully`);

        // Get inserted special for response
        special = await db.query(`SELECT * FROM specials WHERE specialId=?`, [result.insertId]);

        return await response(201, special);
    } catch (err) {
        console.log('ERROR adding special');
        return await handleError(err);
    }
}

/*
 * PUT: /v1/specials
 */
async function updateSpecial(id, body) {
    try {
        console.log(`PUT special called (id: ${id})`);

        // Validate provided info
        if (!id || isNaN(id))
            return await response(400, 'Invalid id');

        // Update the special
        let special = JSON.parse(body);        
        
        // Get inserted special for response
        let result = await db.query(`
            UPDATE specials SET name=?, city=?, state=?, email=?, phone=?, zip=? WHERE specialId=?
        `, [
            special.name,
            special.city,
            special.state,
            special.email,
            special.phone,
            special.zip,
            id         
        ]);

        console.log(`PUT request completed successfully`);
        return await response(204, null);
    } catch (err) {
        console.log('ERROR updating special');
        return await handleError(err);
    }
}

/*
 * DELETE: /v1/specials/{id}
 */
async function deleteSpecial(id) {
    try {
        console.log(`DELETE special called (id: ${id})`);

        // Validate provided info
        if (!id || isNaN(id))
            return await response(400, 'Invalid id');

        let result = await db.query(`DELETE FROM specials WHERE specialId=?`,[id]);

        console.log(`DELETE request completed successfully (id: ${id})`);
        return await response(204, null);
    } catch (err) {
        console.log('ERROR deleting special');
        return await handleError(err);
    }
}

// // ======================================================================= Helper Methods
async function handleError(err) {
    if (err.message) {
        console.log(err.message);
        return await response(500, err.message);
    } else {
        console.log(err);
        return await response(500, err);
    }
}

async function response(statusCode, body) {
    //await db.dispose(); // clean up any remaining db connections
    return { statusCode: statusCode, body: JSON.stringify(body) };
}
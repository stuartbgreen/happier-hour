/*
 * Establishments API
 * /v1/establishments
 * 
 * GET: /v1/establishments
 * GET: /v1/establishments/{id}
 * POST: /v1/establishments
 * PUT: /v1/establishments/{id}
 * DELETE: /v1/establishments/{id}
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
         * /v1/establishments endpoint, we can assume it will always have
         * at least 2 parts.
         */
        const parts = event.path.split('/');
        const method = event.httpMethod;
        parts.shift();

        // Call appropriate function based on url and method
        if (method == 'GET' && parts.length == 2) {
            return await getAllEstablishments(); // GET all establishments
        } else if (method == 'GET' && parts.length == 3) {
            return await getEstablishment(parts[2]); // GET individual establishment
        } else if (method == 'POST' && parts.length == 2) {
            return await addEstablishment(event.body); // POST new establishment
        } else if (method == 'PUT' && parts.length == 3) {
            return await updateEstablishment(parts[2], event.body); // UPDATE establishment
        } else if (method == 'DELETE' && parts.length == 3) {
            return await deleteEstablishment(parts[2]); // DELETE establishment
        } else {
            return await response(400, 'Invalid url'); // Invalid url
        }

    } catch (err) {
        return await handleError(err);
    }
};

// ======================================================================= CRUD Methods

/*
 * GET: /v1/establishments
 */
async function getAllEstablishments() {
    try {
        console.log(`GET all establishments called`);

        let result = await db.query(`select * from establishments`);

        return await response(200, result);
    } catch (err) {
        return await handleError(err);
    }
}

/*
 * GET: /v1/establishments/{id}
 */
async function getEstablishment(id) {
    try {
        console.log(`GET establishment called (id: ${id})`);

        if (!id || isNaN(id))
            return await response(400, 'Invalid id');

        let result = await db.query(`SELECT * FROM establishments WHERE establishmentId=?`, [id]);

        if (result == null || result[0] == null)
            return await response(404, 'Establishment with specified id does not exist.');

        return await response(200, result[0]);
    } catch (err) {
        console.log('ERROR getting establishment');
        return await handleError(err);
    }
}

/*
 * POST: /v1/establishments
 */
async function addEstablishment(body) {
    try {
        console.log(`POST establishment called`);        

        // Add establishment to DB
        let establishment = JSON.parse(body);

        let result = await db.query(`
            INSERT INTO establishments(name, city, state, email, phone, zip) VALUES(?,?,?,?,?,?)
        `, [
            establishment.name,
            establishment.city,
            establishment.state,
            establishment.email,
            establishment.phone,
            establishment.zip            
        ]);

        console.log(`POST request completed successfully`);

        // Get inserted establishment for response
        establishment = await db.query(`SELECT * FROM establishments WHERE establishmentId=?`, [result.insertId]);

        return await response(201, establishment);
    } catch (err) {
        console.log('ERROR adding establishment');
        return await handleError(err);
    }
}

/*
 * PUT: /v1/establishments
 */
async function updateEstablishment(id, body) {
    try {
        console.log(`PUT establishment called (id: ${id})`);

        // Validate provided info
        if (!id || isNaN(id))
            return await response(400, 'Invalid id');

        // Update the establishment
        let establishment = JSON.parse(body);        
        
        // Get inserted establishment for response
        let result = await db.query(`
            UPDATE establishments SET name=?, city=?, state=?, email=?, phone=?, zip=? WHERE establishmentId=?
        `, [
            establishment.name,
            establishment.city,
            establishment.state,
            establishment.email,
            establishment.phone,
            establishment.zip,
            id         
        ]);

        console.log(`PUT request completed successfully`);
        return await response(204, null);
    } catch (err) {
        console.log('ERROR updating establishment');
        return await handleError(err);
    }
}

/*
 * DELETE: /v1/establishments/{id}
 */
async function deleteEstablishment(id) {
    try {
        console.log(`DELETE establishment called (id: ${id})`);

        // Validate provided info
        if (!id || isNaN(id))
            return await response(400, 'Invalid id');

        let result = await db.query(`DELETE FROM establishments WHERE establishmentId=?`,[id]);

        console.log(`DELETE request completed successfully (id: ${id})`);
        return await response(204, null);
    } catch (err) {
        console.log('ERROR deleting establishment');
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
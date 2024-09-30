const express = require("express");
const path = require("path");
const cors = require("cors");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();

app.use(express.json());
app.use(cors());

const dbPath = path.join(__dirname, "database.db");

let db = null;

const initializeDBAndServer = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        app.listen(4000, () => {
            console.log("Server is running at http://localhost:4000");
        });
    } catch (e) {
        console.log(`DB Error: ${e.message}`);
        process.exit(1);
    }
}

initializeDBAndServer();

//POST Endpoint to register user and address
app.post("/register", async (request, response) => {
    const { name, address } = request.body;

    try {
        //Check if user already exists
        const existingUserQuery = `SELECT * FROM user WHERE name = ?`;
        const existingUser = await db.get(existingUserQuery, [name]);

        let userId;

        if (!existingUser) {
            //Insert user into the user table
            const createUserQuery = `INSERT INTO user (name) VALUES (?);`;
            const userResult = await db.run(createUserQuery, [name]);
            userId = userResult.lastID;
        } else {
            userId = existingUser.id;
        }

        //Insert address into the address table
        const createAddressQuery = `INSERT INTO address (userId, address) VALUES (?, ?);`;
        await db.run(createAddressQuery, [userId, address]);

        response.status(201).send("User and Address Successfully Registered!");
    } catch (error) {
        console.log(`Error: ${error.message}`);
        response.status(500).send("An error occured while registering the user.");
    }
});

//GET Endpoint to retrieve all users
app.get("/users", async (request, response) => {
    try {
        const getUsersQuery = `
          SELECT 
            user.id, user.name
          FROM 
            user LEFT JOIN address ON user.id = address.userId;
        `;
        const users = await db.all(getUsersQuery);
        response.status(200).send(users);
    } catch (error) {
        console.log(`Error: ${error.message}`);
        response.status(500).send("An error occured while retrieving users.");
    }
});

//GET Endpoint to retrieve all addresses
app.get("/address", async (request, response) => {
    try {
        const getAddressQuery = `SELECT * FROM address;`;
        const addresses = await db.all(getAddressQuery);

        response.status(200).send(addresses);
    } catch (error) {
        console.log(`Error: ${error.message}`);
        response.status(500).send("An error occured while retrieving addresses.");
    }
});

app.get("/", (request, response) => {
    try {
        response.send("Welcome! This is a Smoke Trees Company Assignment backend domain.Please access any path to get the data like /users, /address .");
    } catch (e) {
        console.log(e.message);
        response.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = app;
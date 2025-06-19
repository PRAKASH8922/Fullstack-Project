import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mysql from 'mysql';
import { createServer } from "http";
import { Server } from "socket.io";
import { graphqlHTTP } from 'express-graphql';
import { buildSchema } from 'graphql';

const app = express();

app.use(cors());
app.use(bodyParser.json());

// MySQL
const conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "ct_db"
});

conn.connect(err => {
  if (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
  console.log("Connected to MySQL database");
});

// Get
app.get('/user', (req, res) => {
  conn.query("SELECT * FROM ct_user_details", (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(result);
  });
});

// Add
app.post('/user', (req, res) => {
  const { name, phone, email, password } = req.body;
  const sql = "INSERT INTO ct_user_details (name, phone, email, password) VALUES (?, ?, ?, ?)";
  conn.query(sql, [name, phone, email, password], (err, result) => {
    if (err) return res.status(500).json({ error: "Insert failed" });
    res.status(201).json({ id: result.insertId, name, phone, email, password });
  });
});

// Update
app.put('/user/:id', (req, res) => {
  const { name, phone, email, password } = req.body;
  const id = req.params.id;
  const sql = "UPDATE ct_user_details SET name = ?, phone = ?, email = ?, password = ? WHERE id = ?";
  conn.query(sql, [name, phone, email, password, id], (err, result) => {
    if (err) return res.status(500).json({ error: "Update failed" });
    if (result.affectedRows === 0) return res.status(404).json({ error: "User not found" });
    res.json({ id, name, phone, email, password });
  });
});

// Delete
app.delete('/user/:id', (req, res) => {
  const id = req.params.id;
  conn.query("DELETE FROM ct_user_details WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: "Delete failed" });
    if (result.affectedRows === 0) return res.status(404).json({ error: "User not found" });
    res.status(204).send();
  });
});

// Login
app.post('/user/login', (req, res) => {
  const { email, password } = req.body;
  const sql = "SELECT id, name, email FROM ct_user_details WHERE email = ? AND password = ?";
  conn.query(sql, [email, password], (err, result) => {
    if (err) return res.status(500).json({ error: "Login failed" });
    res.json(result);
  });
});

app.listen(8001, () => {
  console.log("Server running at http://localhost:8001");
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

io.on("connection", socket => {
  console.log("User connected: ", socket.id);
  socket.on("message", data => {
    io.emit("message", data); // Broadcast to all users
  });
});

httpServer.listen(8000, () => {
  console.log("Socket Server running on http://localhost:8000");
});

const schema = buildSchema(`
  type User {
    id: ID!
    name: String
    phone: String
    email: String
  }

  type Query {
    getUsers: [User]
  }

  input UserInput {
    name: String
    phone: String
    email: String
    password: String
  }

  type Mutation {
    createUser(input: UserInput): User
  }
`);

const root = {
  getUsers: () => {
    return new Promise((resolve, reject) => {
      conn.query("SELECT * FROM ct_user_details", (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },
  createUser: ({ input }) => {
    return new Promise((resolve, reject) => {
      const { name, phone, email, password } = input;
      conn.query(
        "INSERT INTO ct_user_details (name, phone, email, password) VALUES (?, ?, ?, ?)",
        [name, phone, email, password],
        (err, result) => {
          if (err) reject(err);
          else resolve({ id: result.insertId, ...input });
        }
      );
    });
  }
};

app.use('/graphql', graphqlHTTP({
  schema,
  rootValue: root,
  graphiql: true
}));
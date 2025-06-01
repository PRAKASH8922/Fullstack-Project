const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(bodyParser.json());

let users = [];

//Read
app.get('/user', (req, res) => {
    res.send(users);
});

//Add
app.post('/user', (req, res) => {
    const newUser = req.body;
    users.push(newUser);
    res.status(201).json(newUser);
});

//Update
app.put('/user/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const updatedUser = req.body;

    if (id >= 0 && id < users.length) {
        users[id] = updatedUser;
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

//Delete
app.delete('/user/:id',(req, res) => {
    const id = parseInt(req.params.id);
    users = users.filter((user, index) => index !== id);
    res.status(204).send();
});

//Port no
const PORT = 8000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

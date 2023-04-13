import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import argon2 from 'argon2';

const app = express();
const port = 8080 || process.env.PORT;

const allowedOrigins = 
['http://localhost:3000', 'https://my-tasklist-web.s3.eu-west-3.amazonaws.com/index.html'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.status(200).send('It works!');
});

app.get('/signin', async (req, res) => {
  const { user, password } = req.query;
  const existingData = fs.readFileSync('data/db.json');
  const data = JSON.parse(existingData);

  if (user === '' || password === ''){
    res.status(403).send({message: 'username or password is missing'})
  }
  
  const userEntry = data.register.find((entry) => entry.user === user);
  if (!userEntry){
    res.status(404).send({message: 'User is not exist'});
    return;
  }

  const passwordCorrect = await argon2.verify(userEntry.password, password);
  if (!passwordCorrect){
    res.status(401).send({message: 'Password is not correct'});
    return;
  }

  res.status(200).send(data.register);
});

app.put('/update-tasks', (req, res) => {
  const {user, important_tasks, general_tasks, completed_tasks} = req.body;
  const existingData = fs.readFileSync('data/db.json');
  const data = JSON.parse(existingData);
  const userIndex = data.register.findIndex((entry) => entry.user === user);

  if (userIndex === -1) {
    res.status(404).send({ message: 'User not found' });
    return;
  }

  data.register[userIndex].important_tasks = important_tasks;
  data.register[userIndex].general_tasks = general_tasks;
  data.register[userIndex].completed_tasks = completed_tasks;

  fs.writeFileSync('data/db.json', JSON.stringify(data));

  res.status(200).send({ message: 'Tasks updated successfully!' });
});

app.post('/register', async (req, res) => {
  const { user, password, important_tasks, general_tasks, completed_tasks } = req.body;

  const existingData = fs.readFileSync('data/db.json');

  const data = JSON.parse(existingData);

  const userExists = data.register.some((entry) => entry.user === user);
  if (userExists) {
    res.status(409).send({message: 'User already exists'});
    return;
  }

  const hashedPassword = await argon2.hash(password);

  data.register.push({user, password:hashedPassword, important_tasks, general_tasks, completed_tasks});

  fs.writeFileSync('data/db.json', JSON.stringify(data));

  res.status(200).send({message: 'great!'});

})

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});







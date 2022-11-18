require('dotenv').config()
var express = require('express');
var cors = require('cors')
const { tokenGenerator } = require('./controller');



var app = express();

app.use(cors({
  origin: '*',
  optionsSuccessStatus: 200
}))


app.use(express.json());

app.post('/generate_token', tokenGenerator);


const PORT = process.env.port || 5000;

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`)
});







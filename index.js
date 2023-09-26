const express = require('express')
const mongoose = require('mongoose')
const expressHhd = require('express-handlebars')
const dotenv = require('dotenv').config()
const todoRoutes = require('./routes/todos')
const redis = require('redis')

const port = process.env.PORT || 3000
const redis_port = process.env.REDIS_PORT || 6379

const client = redis.createClient();
client.connect().then(async () => {
  await start()
})

const app = express()
const hbs = expressHhd.create({
  defaultLayout: 'main',
  extname: 'hbs',
})

app.engine('hbs', hbs.engine)
app.set('view engine', 'hbs')
app.set('views', 'views')

app.use(express.urlencoded({extended: true}))

app.use(todoRoutes)

// Set response
function setResponse(username, repos) {
  return `<h2>${username} has ${repos} Github repos</h2>`;
}


async function start() {
  try {
    console.log('db conn', process.env.MONGO_URL)
    await mongoose.connect(
      process.env.MONGO_URL, {
      dbName: 'test_mongo',
      useNewUrlParser: true,
      useFindAndModify: false,
    })

    app.listen(port, () => {
      console.log('server has been init...')
    })
  } catch (e) {
    console.log(e)
  }
}

// Make request to Github for data
async function getRepos(req, res, next) {
  try {
    console.log('Fetching Data...');

    const { username } = req.params;

    console.log('works here');

    const response = await fetch(`https://api.github.com/users/${username}`);

    const data = await response.json();

    const repos = data.public_repos;

    // Set data to Redis
    client.setex(username, 3600, repos);

    res.send(setResponse(username, repos));
  } catch (err) {
    console.error(err);
    res.status(500);
  }
}

// Cache middleware
function cache(req, res, next) {
  const { username } = req.params;

  client.get(username, (err, data) => {
    if (err) throw err;

    if (data !== null) {
      res.send(setResponse(username, data));
    } else {
      next();
    }
  });
}

app.get('/repos/:username', cache, getRepos);

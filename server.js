const express = require('express')
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt-nodejs')
const cors = require('cors')
const knex = require('knex')

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'test',
    database : 'smartbrain'
  }
});

const app = express()

app.use(bodyParser.json())
app.use(cors())

app.get('/', (req, res) => {
	res.json(database.users)
})

app.post('/signin', (req, res) => {
	db.select('email', 'hash').from('login')
		.where({'email': req.body.email})
		.then(data => {
			const isValid = bcrypt.compareSync(req.body.password, data[0].hash)
			if(isValid) {
				db.select('*').from('users')
					.where({email: req.body.email})
					.then(user => {
						res.json(user[0])
					})
					.catch(err => res.status(400).json('unable to get user'))
			} else{
				res.status(400).json('Wrong password')
			}
		})
		.catch(err => res.status(400).json('Wrong credentials'))
})

app.post('/register', (req, res) => {
	const { name, email, password } = req.body
	const hash = bcrypt.hashSync(password)
	db.transaction(trx => {
		trx('login')
		.insert({
			hash: hash,
			email:email
		})
		.returning('email')
		.then(loginEmail => {
			return trx('users')
			.returning('*')
			.insert({ 
				email: loginEmail[0],
				name: name,
				joined: new Date()
			})
			.then(user => {
				res.json(user[0])
			})
		})
		.then(trx.commit)
		.catch(trx.rollback)
	})
	.catch(err => res.json('error'))
})

app.get('/profile/:id', (req, res) => {
	const { id } = req.params
	db.select('*').from('users').where({
		id: id
	}).then(user => {
		if(user.length) {
			res.json(user[0])
		} else {
			res.status(400).json('Not found')
		}
	})
})

app.put('/image', (req, res) => {
	const { id } = req.body
	db('users').where({id})
		.increment('entries', 1)
		.returning('entries')
		.then(entries => {
			res.json(entries)
		})
		.catch(err => res.status(400).json('Unable to get entries'))
})

app.listen(process.env.PORT, () => {
	console.log(`app is running in ${process.env.PORT}`)
})
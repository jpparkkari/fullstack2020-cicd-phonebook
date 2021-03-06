require('dotenv').config()
const express = require('express')
const app = express()

const morgan = require('morgan')
const cors = require('cors')

app.use(cors())
app.use(express.json())
app.use(express.static('build'))

morgan.token('message', function (req) { return JSON.stringify(req.body) })
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :message'))
//app.use(morgan('tiny'))

const Person = require('./models/person')

//getall
app.get('/api/persons', (req, res, next) => {
  Person.find({})
    .then(people => {
      res.json(people)
    })
    .catch(error => next(error))
})

app.get('/info', (req, res) => {
  //console.log(persons.length)
  const date = new Date()
  Person.find({})
    .then(people => {
      res.send(`
        <p>Phonebook has info for ${people.length} persons</p>
        <p>${date}</p>
      `)
    })
})

app.get('/health', (req, res) => {
  res.send('ok')
})

//change this to use mongodb
app.get('/api/persons/:id', (req, res, next) => {
  Person.findById(req.params.id)
    .then(person => {
      if (person) {
        res.json(person)
      } else {
        res.status(404).end()
      }
    })
    .catch(error => next(error))
  /*
  const id = Number(req.params.id)
  const person = persons.find( person => person.id === id )
    if (person) {
      res.json(person)
    } else {
      res.status(404).end()
    }
    console.log(person) */
})

app.delete('/api/persons/:id', (req, res, next) => {

  Person.findByIdAndRemove(req.params.id)
    .then(
      res.status(204).end()
    )
    .catch(error => next(error))
})

/*const generateId = () => {
  return Math.floor(Math.random() * 100000)
}*/

app.post('/api/persons', (req, res, next) => {

  const body = req.body

  if(!body.name || !body.number) {
    return res.status(400).json({
      error: 'name, number or both missing'
    })
  }
  /* not needed to check duplicates in 3.13
  if(persons.find( person => person.name === body.name)) {
    return res.status(400).json({
      error: 'name must be unique'
    })
  }
  */

  const person = new Person({
    name: body.name,
    number: body.number,
    //id: generateId(),
  })

  console.log(person)
  person.save()
    .then(savedPerson => {
      res.json(savedPerson)
    })
    .catch( error => next(error))
})

app.put('/api/persons/:id', (req, res, next) => {
  // update record
  const body = req.body

  const person = {
    name: body.name,
    number: body.number,
  }

  Person.findByIdAndUpdate(req.params.id, person, { new: true, runValidators: true, context: 'query' })
    .then(updatedPerson => {
      console.log(updatedPerson.toJSON())
      res.json(updatedPerson.toJSON())
    })
    .catch(error => next(error))
})

const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: 'unknown endpoint' })
}


// olemattomien osoitteiden käsittely
app.use(unknownEndpoint)

const errorHandler = (error, req, res, next) => {
  console.error(error.message)

  if (error.name === 'CastError' && error.kind === 'ObjectId') {
    return res.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return res.status(400).json({ name: error.name, error: error.message })
  }

  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

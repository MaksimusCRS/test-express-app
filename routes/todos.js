const { Router } = require('express')
const router = Router()
const Todo = require('../models/Todo')

router.get('/', async (req, res) => {
  const todos = await Todo.find({})

  res.render('index', {
    title: 'Todos list',
    isIndex: true,
    todos,
  })
})

router.get('/create', (req, res) => {
  res.render('create', {
    title: 'Create todo',
    isCreate: true,
  })
})

router.post('/create', async (req, res) => {
  console.log('req', req.body)
  const created_todo = await Todo.create({
      title: req.body.title,
    })

  console.log('created', created_todo);

    res.redirect('/')
})

module.exports = router

process.env['NTBA_FIX_319'] = 1
require('dotenv-extended').load({
  encoding: 'utf8',
  silent: true,
  path: '.env',
  defaults: '.env.defaults',
  schema: '.env.schema',
  errorOnMissing: false,
  errorOnExtra: false,
  includeProcessEnv: false,
  assignToProcessEnv: true,
  overrideProcessEnv: false,
})

const createError = require('http-errors')
const express = require('express')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const TelegramBot = require('node-telegram-bot-api')
const axios = require('axios')

const indexRouter = require('./routes/index')

const app = express()

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

app.use('/', indexRouter)

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404))
})

// error handler
app.use((err, req, res) => {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // send the error page
  res.status(err.status || 500)
  res.send('error')
})

// Bot usage
const token = process.env.BOTTOKEN
const bot = new TelegramBot(token, { polling: true })
axios.defaults.baseURL = 'http://localhost:3000'

let tmpMenu = []

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id

  const syntax = [
    '/myorder',
    '/menu',
    '/checkPayment',
  ]
  bot.sendMessage(chatId, `Use this for order: ${syntax[0]} , this one for list menu ${syntax[1]} , and this one for check your payment status ${syntax[2]}`)
})

bot.onText(/\/menu/, async(msg) => {
  const menus = () => {
    return axios.get('/menu').then((item) => {
      let data = []
      item.data.map(item =>{
        data.push(`${item.name} = Rp.${item.price}`)
      })
      return data
    })
  }
  const result = await menus()
  const response = {
    reply_to_message_id: msg.message_id,
    reply_markup: JSON.stringify({
      keyboard: [ result ],
    }),
  }
  bot.sendMessage(msg.chat.id, 'What do you want to order?', response)
  bot.onText(/(.+)/, (msg, match) => {
    const resp = match[0]

    result.find(item => {
      if (item === resp) {
        tmpMenu.push(resp)
        bot.sendMessage(msg.chat.id, `Noted ${msg.chat.first_name}: ${resp}`)

      }
    })
    if (tmpMenu.length > 3) {
      bot.sendMessage(msg.chat.id, `${msg.chat.first_name}, type /done if you don't want to order anymore!`)
    }
  })

  // console.log(ifOrderExist())
  return response.reply_markup.keyboard = []
})

bot.onText(/\/myorder/, (msg) => {
  if (tmpMenu.length != 0){
    const text = `
    Here's Your order for today:
    ${tmpMenu.map(item => {
    return `${item} `
  })}`
    bot.sendMessage(msg.chat.id, text.replace(/(^,)|(,$)/g, ''), tmpMenu)
  } else {
    bot.sendMessage(msg.chat.id, `${msg.chat.first_name}, you still not ordering yet. Type /menu to start order and /done to finish.`)
  }
})

module.exports = app

const express = require('express')
const router = express.Router()

/* GET home page. */
router.get('/', (req, res) => {
  res.status(200).send({
    title: 'Bot Server',
    'version': '1.0',
    'message': 'Bot server is up, and you can chat with this bot via Telegram',
  })
})

module.exports = router

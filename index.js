const express = require('express')
const avgPrice = require('./usdtTicket')
const bodyParser = require('body-parser')

const app = express()
const port = process.env.PORT || 3000

app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', async (req, res) => {
  const price = await avgPrice()
  res.send(String(price))
})

// App Connection
app.listen(port, () => {
  console.log('Sever is running at port: ' + port)
})

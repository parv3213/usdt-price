require('dotenv').config()
const https = require('https')
const nodemailer = require('nodemailer')
const smtpTransport = require('nodemailer-smtp-transport')

const { HOST_STRING, PORT_NUMBER, FROM_USER, FROM_PASSWORD, TO_USER } = process.env

function fetchP2PData(page = 1, fiat = 'INR', tradeType = 'SELL', asset = 'USDT') {
  return new Promise((resolve, reject) => {
    const baseObj = {
      page,
      rows: 5,
      payTypes: [],
      publisherType: null,
      asset,
      tradeType,
      fiat,
    }

    const stringData = JSON.stringify(baseObj)

    const options = {
      hostname: 'p2p.binance.com',
      port: 443,
      path: '/bapi/c2c/v2/friendly/c2c/adv/search',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': stringData.length,
      },
    }

    const req = https.request(options, (res) => {
      let output = ''
      res.on('data', (d) => {
        output += d
      })

      res.on('end', () => {
        try {
          const jsonOutput = JSON.parse(output)
          // resolve(jsonOutput.data.map((data) => data.adv.price))
          resolve(jsonOutput)
        } catch (e) {
          reject(e)
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.write(stringData)
    req.end()
  })
}

const avgPrice = async () => {
  const jsonOutput = await fetchP2PData()
  const priceArray = jsonOutput.data.map((d) => parseFloat(d.adv.price))

  const sum = priceArray.reduce((a, b) => a + b, 0)
  const avg = sum / priceArray.length || 0
  return avg
}

const sendMail = async () => {
  const transporter = nodemailer.createTransport(
    smtpTransport({
      host: HOST_STRING,
      port: Number(PORT_NUMBER),
      auth: {
        user: FROM_USER,
        pass: FROM_PASSWORD,
      },
    }),
  )

  const mailOptions = {
    from: FROM_USER,
    to: TO_USER,
    subject: `USDC INR Price: ${(await avgPrice()).toFixed(2)}`,
  }

  try {
    await transporter.sendMail(mailOptions)
  } catch (e) {
    console.log('Error: ', e.message)
  }
}

sendMail()

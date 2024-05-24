const express = require('express')
const app = express()
const geoip = require('geoip-lite')
const DeviceDetector = require('node-device-detector')
const dns = require('dns')
const path = require('path')

app.use(express.static(path.join(__dirname, 'public')))

function getCountryFlag(country) {
  return getRegionalIndicatorSymbol(country[0]) + getRegionalIndicatorSymbol(country[1])
}

function getRegionalIndicatorSymbol(letter) {
  return String.fromCodePoint(0x1f1e6 - 65 + letter.toUpperCase().charCodeAt(0))
}

//Сервис вводимого IP

const inputIP = () => {
  return `
<h1>Enter custom destination</h1>
<div>
        <form action="/" method="GET" >
                <label>Enter IP or domain:</label>
                <input required placeholder="Enter IP or domain" type='text' name='dest'/>
                <input type='submit' value='Submit'/>
        </form>
</div>
`
}

//Конец сервиса вводимого IP

const msg = (ip, curl, domain) => {
  const loc = geoip.lookup(ip)
  console.log(ip, loc)
  const cityFull = require('country-code-lookup')

  const header = `<link rel="icon" type="image/x-icon" href="favicon.ico">`

  const styles = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&display=swap');
            body{
            	display: flex;
            	justify-content: flex-start;
            	align-items: center;
            	flex-direction: column;
            }
            *{
                font-family: "Montserrat";
            }
            div{
                display:block;
            }
            
            input{
                outline:none;
            }
            
            input[type='text']{
                padding: .4rem .7rem;
                font-size: 1rem;
            }
            
            input[type='submit']{
                display: block;
                padding: .5rem;
                font-size: 1rem;
                cursor: pointer;
            }
            
            
            label{
                font-size: 1.3rem;
            }
            
            form{
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }
        </style>
`
  if (!curl) {
    return `
    <title>Your IP location</title>
${header}
${styles}
<h1>Your IP: ${ip}</h1>
${domain ? `<h1>Your domain: ${domain}</h1>` : ''}
<div>    <h1>Your location:</h1>
${
  !!loc &&
  `
${
  !!loc.country &&
  `<p>Country Code: ${loc.country}</p>
<p>Country: ${cityFull.byIso(loc.country).country} ${getCountryFlag(loc.country)}</p>`
}
${!!loc.region ? `<p>Region: ${loc.region}</p>` : ''}
${!!loc.timezone ? `<p>Timezone: ${loc.timezone}</p>` : ''}
${!!loc.city ? `<p>City: ${loc.city}</p>` : ''}`
}
    </div>`
  } else {
    let result = ''
    result += `Your IP: \x1B[1m${ip}\x1B[0m\r\n`
    result += 'Your location:\r\n'
    if (domain) result += `Your domain: \x1B[1m${domain}\x1B[0m\r\n`
    if (loc) {
      if (loc.country) {
        result += `Country Code: ${loc.country}\r\nCountry: ${cityFull.byIso(loc.country).country}\r\n`
      }
      if (loc.region) {
        result += `Region: ${loc.region}\r\n`
      }
      if (loc.timezone) {
        result += `Timezone: ${loc.timezone}\r\n`
      }
      if (loc.city) {
        result += `City: ${loc.city}\r\n`
      }
    }
    return result
  }
}
/*
{
  os: {
    name: 'Windows',
    short_name: 'WIN',
    version: '10',
    platform: 'x64',
    family: 'Windows'
  },
  client: {
    type: 'browser',
    name: 'Microsoft Edge',
    short_name: 'PS',
    version: '120.0.0.0',
    engine: 'Blink',
    engine_version: '120.0.0.0',
    family: 'Internet Explorer'
  },
  device: { id: '', type: 'desktop', brand: '', model: '' }
}
*/
function clientInfo(detector) {
  let result = ''
  result += `
<h1>Your client:</h1>
${
  detector.client &&
  `
  <div>
  ${detector.client.type ? `<p>Client type: ${detector.client.type}</p>` : ''}
  ${detector.client.name ? `<p>Client name: ${detector.client.name}</p>` : ''}
  ${detector.client.version ? `<p>Client version: ${detector.client.version}</p>` : ''}
  ${detector.client.engine ? `<p>Client engine: ${detector.client.engine}</p>` : ''}
  ${detector.client.family ? `<p>Client family: ${detector.client.family}</p>` : ''}
</div>`
}
`
  return result
}
/*name: 'Windows',
    short_name: 'WIN',
    version: '10',
    platform: 'x64',
    family: 'Windows'*/
function osInfo(detector) {
  let result = ''
  result += `
<h1>Your operating system:</h1>
${
  detector.os &&
  `
  <div>
  ${detector.os.name ? `<p>Operating system's name: ${detector.os.name}</p>` : ''}
  ${detector.os.version ? `<p>Operating system's version: ${detector.os.version}</p>` : ''}
  ${detector.os.platform ? `<p>Operating system's platform: ${detector.os.platform}</p>` : ''}
  ${detector.os.family ? `<p>Operating system's family: ${detector.os.family}</p>` : ''}
</div>`
}
`
  return result
}
/*
device: {
    id: 'XI',
    type: 'phablet',
    brand: 'Xiaomi',
    model: 'Redmi Note 10 Pro'
  }
*/
function deviceInfo(detector) {
  let result = ''
  result += `
<h1>Your device:</h1>
${
  detector.device &&
  `
  <div>
  ${detector.device.type ? `<p>Device's type: ${detector.device.type}</p>` : ''}
  ${detector.device.brand ? `<p>Device's brand: ${detector.device.brand}</p>` : ''}
  ${detector.device.model ? `<p>Device's model: ${detector.device.model}</p>` : ''}
</div>`
}
`
  return result
}
const detector = new DeviceDetector({
  clientIndexes: true,
  deviceIndexes: true,
  deviceAliasCode: false,
})

app.use((req, res, next) => {
  const clientIP = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress
  req.clientIP = clientIP // Сохраняем IP-адрес клиента в объекте запроса для использования в обработчиках маршрутов
  next()
})

app.use(function (req, res, next) {
  res.ua = req.get('User-Agent')
  next()
})

// Middleware для обработки запросов, отправленных с помощью curl
app.use((req, res, next) => {
  const isCurlRequest = req.get('User-Agent') && req.get('User-Agent').includes('curl')
  let ip
  const input_dest = req.query.dest

  dns.lookup(input_dest, (err, addresses, family) => {
    let domain = false
    if (err) {
      console.log('Ошибка при выполнении DNS-запроса:', err)
      ip = input_dest ? input_dest : req.clientIP
    } else {
      console.log('IP-адреса для домена', input_dest, ':', addresses)
      ip = input_dest ? addresses : req.clientIP
      domain = input_dest
    }

    if (isCurlRequest) {
      // Если запрос отправлен с помощью curl, отправьте специальный ответ
      res.status(200).send(msg(ip, true, domain))
    } else {
      // Если запрос не отправлен с помощью curl, передайте управление следующему middleware
      next()
    }
  })
})

app.get('/', (req, res) => {
  const input_dest = req.query.dest
  let ip
  console.log(ip)
  console.log(detector.detect(res.ua))

  dns.lookup(input_dest, (err, addresses, family) => {
    let domain = false
    if (err) {
      console.log('Ошибка при выполнении DNS-запроса:', err)
      ip = input_dest ? input_dest : req.clientIP
    } else {
      console.log('IP-адреса для домена', input_dest, ':', addresses)
      ip = input_dest ? addresses : req.clientIP
      domain = input_dest
    }

    res.send(
      msg(ip, false, domain) +
        inputIP() +
        clientInfo(detector.detect(res.ua)) +
        osInfo(detector.detect(res.ua)) +
        deviceInfo(detector.detect(res.ua)),
    )
  })

  /*  res.send(

msg(ip, false) +
inputIP() +
clientInfo(detector.detect(res.ua)) +
osInfo(detector.detect(res.ua)) +
deviceInfo(detector.detect(res.ua)))
*/
})

app.listen(3000, () => {
  console.log(`Example app listening on port 3001`)
})

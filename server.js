const express = require('express')
const app = express()
const arguments = require('minimist')(process.argv.slice(2))

const db = require('./database.js')

const morgan = require('morgan')
const fs = require('fs')

app.use(express.urlencoded({ extended: true}));
app.use(express.json());

const port = arguments.port || process.env.port || 5000

const server = app.listen(port, () => {
    console.log('App listening on port %PORT%'.replace('%PORT%', port))
});


app.get('/app/', (req, res) => {
    // Respond with status 200
    res.statusCode = 200;
    // Respond with status message "OK"
    res.statusMessage = 'OK';
    res.writeHead(res.statusCode, { 'Content-Type': 'text/plain' });
    res.end(res.statusCode + ' ' + res.statusMessage)
});




if (arguments.log == 'false'){
    console.log("not creating access.log")
  } else{
    const WRITESTREAM = fs.createWriteStream('access.log', { flags: 'a' })
    // Set up the access logging middleware
    app.use(morgan('combined', { stream: WRITESTREAM }))
    
  }

//help text
const help = (`
server.js [options]

  --por		Set the port number for the server to listen on. Must be an integer
              	between 1 and 65535.

  --debug	If set to true, creates endlpoints /app/log/access/ which returns
              	a JSON access log from the database and /app/error which throws 
              	an error with the message "Error test successful." Defaults to 
		false.

  --log		If set to false, no log files are written. Defaults to true.
		Logs are always written to database.

  --help	Return this message and exit.
  `)



// If --help or -h, echo help text to STDOUT and exit
if (arguments.help || arguments.h) {
    console.log(help)
    process.exit(0)
}

app.use( (req, res, next) => {
    let logdata = {
        remoteaddr: req.ip,
        remoteuser: req.user,
        time: Date.now(),
        method: req.method,
        url: req.url,
        protocol: req.protocol,
        httpversion: req.httpVersion,
        status: res.statusCode,
        referer: req.headers['referer'],
        useragent: req.headers['user-agent']
    }
    const stmt = db.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time,
        logdata.method, logdata.url, logdata.protocol,
        logdata.httpversion, logdata.secure, logdata.status,
        logdata.referer, logdata.useragent)
    next()
})

if (arguments.debug || arguments.d){
    app.get('/app/log/access/', (req, res, next) => {
    const stmt = db.prepare('SELECT * FROM accesslog').all()
    res.status(200).json(stmt)

    })
    app.get('/app/error/', (req, res, next) => {
      throw new Error('Error')
    })
}




app.get('/app/flip/', (req, res) => {
    var flip = coinFlip()
    res.status(200).json({ 'flip' : flip })
 })  
 
 
 app.get('/app/flips/:number', (req, res) => {
     const finalFlips = coinFlips(req.params.number)
     res.status(200).json({ 'raw': finalFlips, 'summary': countFlips(finalFlips) })
 
 }
 )
 
 app.get('/app/flip/call/heads', (req, res) => {
     const flipRandomCoin = flipACoin("heads")
     res.status(200).json( {"call": flipRandomCoin.call, "flip": flipRandomCoin.flip, "result": flipRandomCoin.result})
 })
 
 app.get('/app/flip/call/tails', (req, res) => {
     const flipRandomCoin = flipACoin("tails")
     res.status(200).json( {"call": flipRandomCoin.call, "flip": flipRandomCoin.flip, "result": flipRandomCoin.result})
 })
 
 
 
 // Default response for any other request
 app.use(function(req, res){
     res.status(404).send('404 NOT FOUND')
 
 })
 




function coinFlip() {
    return (Math.floor(Math.random() * 2) == 0) ? 'heads' : 'tails';
}


function coinFlips(flips) {
    let flipCount = flips;
    const flipResults = new Array();
    while(flipCount>0) {
      flipResults.push(coinFlip());
      flipCount--;
    }
    return flipResults;
}

function countFlips(array) {
    var count = {
        tails: 0,
        heads: 0
    }
    for (let i = 0; i < array.length; i++) {
        if (array[i] == 'heads') {
            count.heads = count.heads + 1
        }
        else {
            count.tails = count.tails + 1
        }
    }
    return count
}

function flipACoin(call) {
    const correct = coinFlip();
    if(correct == call) {
      return {'call': call, 'flip': correct, 'result': 'win'};
    } else {
      return {'call': call, 'flip': correct, 'result': 'lose'};
    }
}




app.get('/app/flip/', (req, res) => {
    var flip = coinFlip()
    res.status(200).json({ "flip": flip })
})

app.get('/app/flips/:number', (req, res) => {
    var flips = coinFlips(req.params.number)
    var count = countFlips(flips)
    res.status(200).json( {'raw': flips, 'summary':count})
})


app.get('/app/flip/call/heads', (req, res) => {
    const result = flipACoin('heads');
    res.status(200).json({
        result
    })
});

app.get('/app/flip/call/tails', (req, res) => {
    const result = flipACoin('tails');
    res.status(200).json({
        result
    })
});





// Default response for any other request.
app.use(function (req, res) {
    res.status(404).send('404 NOT FOUND')
});
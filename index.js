var express = require('express');
var bodyParser = require("body-parser");
const dgram = require("dgram");
const process = require("process");
var mosca = require('mosca');
var mqtt = require('mqtt')
var ip = require("ip");

// HTTP

var app = express();
app.use(bodyParser.json());

app.post('/', function (req, res) {
    console.log('\nGot a message via POST request:');
    console.log(req.body);
    res.send('');
  });

app.listen(3000, function () {
  console.log('listening on HTTP port 3000...');
});

var settings = {
    port: 1883
}

// MQTT server

var server = new mosca.Server(settings);

server.on('ready', function () {
    console.log("MQTT server ready...");
});

// MQTT client

var client = mqtt.connect('mqtt://localhost');

client.on('connect', function () {
    client.subscribe('#') // subscribe to all topics
})
client.on('message', function (topic, message, package) {
    console.log('\nNew MQTT message:')
    console.log('Date: ', new Date());
    console.log('topic: ', topic)
    console.log('message: ', message.toString());
    console.log('----------------------------------------');
})

// Broadcast register

const PORT = 20000;
const MULTICAST_ADDR = "233.255.255.255";

const socket = dgram.createSocket({ type: "udp4", reuseAddr: true });

socket.bind(PORT);

socket.on("listening", function() {
  socket.addMembership(MULTICAST_ADDR);
  const address = socket.address();
  console.log(
    `UDP socket listening on ${address.address}:${address.port} pid: ${
      process.pid
    }`
  );
});

socket.on("message", function(message, rinfo) {
  console.info(`Register request from: ${rinfo.address}:${rinfo.port}`);
  socket.send(`{\"http\":\"http://${ip.address()}:3000\", \"mqtt\":\"mqtt://${ip.address()}\"}`, rinfo.port, rinfo.address)
});

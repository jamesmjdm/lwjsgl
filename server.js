const ws = require("ws")
const glm = require("./src/gl-matrix")
const vec2 = glm.vec2
const Packet = require("./src/packet")

const MAX_PLAYERS = 16

class Client {
    constructor(socket, id) {

        this.socket = socket
        this.id = id

        this.position = vec2.create(0,0)
        this.velocity = vec2.create(0,0)
        this.angle = 0

        this.writeBuf = Buffer.alloc(128)
    }
}

class Game {

    constructor() {
        this.clients = []
        this.nextClientId = 1
        this.stateBuf = Buffer.alloc(MAX_PLAYERS*32+100)

        this.server = new ws.Server({ port : 9001, perMessageDeflate : false }, () => {
            console.log("server listening on OVER 9000")
        })
        this.server.on("connection", (socket) => {
            console.log("client connected")
            this.nextClientId++

            let nc = new Client(socket, this.nextClientId)

            socket.on("message", (data, flags) => {
                this.clientMessage(nc, data)
            })
            socket.on("close", (evt) => {
                this.clientLeft(nc)
            })

            this.clientJoined(nc)
        })
    }

    clientJoined(cl) {
        console.log("client joined")
        
        this.clients.push(cl)
        
        // send handshake to new player
        cl.writeBuf.writeUInt16BE(Packet.Handshake, 0)
        cl.writeBuf.writeUInt16BE(cl.id, 2)
        cl.socket.send(cl.writeBuf)
        
        this.clients.forEach((c) => {
            // send all existing players to new player
            cl.writeBuf.writeUInt16BE(Packet.PlayerExisting, 0)
            cl.writeBuf.writeUInt16BE(c.id, 2)
            cl.socket.send(cl.writeBuf)
        })

        this.clients.forEach((c) => {
            if (c === cl) {
                return;
            }
            // send player join message
            c.writeBuf.writeUInt16BE(Packet.PlayerJoin, 0)
            c.writeBuf.writeUInt16BE(cl.id, 2)
            c.socket.send(c.writeBuf)
        })
    }
    clientMessage(cl, data) {
        let msg = data.readUInt16BE(0) // which message

        switch (msg) {
            case Packet.ClientPosition: {
                cl.position.x = data.readFloatBE(2)
                cl.position.y = data.readFloatBE(6)
                cl.velocity.x = data.readFloatBE(10)
                cl.velocity.y = data.readFloatBE(14)
                cl.angle = data.readFloatBE(18)
                break;
            }
        }
    }
    clientLeft(cl) {
        console.log("client left", cl.id)
        // send player leave message to all players
        this.clients = this.clients.filter(c => c != cl)

        this.clients.forEach(c => {
            c.writeBuf.writeUInt16BE(Packet.PlayerLeft, 0)
            c.writeBuf.writeUInt16BE(cl.id, 2)
            c.socket.send(c.writeBuf)
        })
    }
    update() {
        
        // statebuf holds 32b per player and 100b for overheads
        // you have been warned
        // this.stateBuf.writeUInt16BE(Packet.GlobalState, 0)
        // let offset = 2

        // this.clients.forEach((c) => {
        //     this.stateBuf.writeUInt16BE(c.id, offset)
        //     this.stateBuf.writeFloatBE(c.position.x, offset+2)
        //     this.stateBuf.writeFloatBE(c.position.y, offset+6)
        //     this.stateBuf.writeFloatBE(c.velocity.x, offset+10)
        //     this.stateBuf.writeFloatBE(c.velocity.y, offset+14)
        //     this.stateBuf.writeFloatBE(c.angle, offset+18)
        //     offset += 22
        // })

        // this.clients.forEach((c) => {
        //     c.socket.send(this.stateBuf)
        // })

        this.clients.forEach((c) => {
            this.clients.forEach((d) => {
                d.writeBuf.writeUInt16BE(Packet.PlayerPosition, 0)
                d.writeBuf.writeUInt16BE(c.id, 2)
                d.writeBuf.writeFloatBE(c.position.x, 6)
                d.writeBuf.writeFloatBE(c.position.y, 10)
                d.writeBuf.writeFloatBE(c.angle, 14)
                d.socket.send(d.writeBuf)
            })
        })

    }
}

let game = new Game()
setInterval(() => game.update(), 20) // 50hz server
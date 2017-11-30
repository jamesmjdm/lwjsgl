const ws = require("ws")
const glm = require("./src/gl-matrix")
const vec2 = glm.vec2
const Packet = require("./src/packet")

const MAX_PLAYERS = 16

class Player {
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
        this.players = []
        this.nextPlayerId = 1
        this.stateBuf = Buffer.alloc(MAX_PLAYERS*32+100)

        this.server = new ws.Server({ 
                port : 9001, 
                perMessageDeflate : false,
                clientTracking : true,
            }, () => {
                console.log("server listening on OVER 9000")
            })
        this.server.on("connection", socket => {
            console.log("player connected")
            this.nextPlayerId++

            let np = new Player(socket, this.nextPlayerId)

            socket.on("message", (data, flags) => {
                this.playerMessage(np, data)
            })
            socket.on("close", evt => {
                this.playerLeft(np)
            })

            this.playerJoined(np)
        })
    }

    playerJoined(player) {
        console.log("player joined")
        
        this.players.push(player)
        
        // send handshake to new player
        player.writeBuf.writeUInt16BE(Packet.Handshake, 0)
        player.writeBuf.writeUInt16BE(player.id, 2)
        player.socket.send(player.writeBuf)
        
        this.players.forEach(p => {
            // send all existing players to new player
            player.writeBuf.writeUInt16BE(Packet.PlayerExisting, 0)
            player.writeBuf.writeUInt16BE(p.id, 2)
            player.socket.send(player.writeBuf)
        })

        this.players.forEach(p => {
            if (p === player) {
                return;
            }
            // send player join message
            p.writeBuf.writeUInt16BE(Packet.PlayerJoined, 0)
            p.writeBuf.writeUInt16BE(player.id, 2)
            p.socket.send(p.writeBuf)
        })
    }
    playerMessage(player, data) {
        let msg = data.readUInt16BE(0) // which message

        switch (msg) {
            case Packet.ClientPosition: {
                player.position.x = data.readFloatBE(2)
                player.position.y = data.readFloatBE(6)
                player.velocity.x = data.readFloatBE(10)
                player.velocity.y = data.readFloatBE(14)
                player.angle = data.readFloatBE(18)
                break;
            }
        }
    }
    playerLeft(player) {
        console.log("player left", player.id)
        // send player leave message to all players
        this.players = this.players.filter(p => p !== player)

        this.players.forEach(p => {
            p.writeBuf.writeUInt16BE(Packet.PlayerLeft, 0)
            p.writeBuf.writeUInt16BE(player.id, 2)
            p.socket.send(p.writeBuf)
        })
    }
    update() {

        this.players.forEach(p1 => {

            this.players.forEach(p2 => {
                p2.writeBuf.writeUInt16BE(Packet.PlayerPosition, 0)
                p2.writeBuf.writeUInt16BE(p1.id, 2)
                p2.writeBuf.writeFloatBE(p1.position.x, 6)
                p2.writeBuf.writeFloatBE(p1.position.y, 10)
                p2.writeBuf.writeFloatBE(p1.velocity.x, 14)
                p2.writeBuf.writeFloatBE(p1.velocity.y, 18)
                p2.writeBuf.writeFloatBE(p1.angle, 22)
                p2.socket.send(p2.writeBuf)
            })
        })

    }
}

let game = new Game()
setInterval(() => game.update(), 20) // 50hz server
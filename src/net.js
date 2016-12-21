// net.js

export default class GameSocket
{
	constructor()
	{
		this.socket = null
		this.buffer = new ArrayBuffer(256)
		this.view = new DataView(this.buffer)
		this.offset = 0

		this.socket.onerror = this._onSocketError
		this.socket.onmessage = this._onSocketMessage

		this.messageHandlers = []
	}

	connect(address)
	{
		this.socket = new WebSocket(address)
		this.socket.binaryType = "arraybuffer"
	}
	on(msg, f)
	{
		this.messageHandlers[msg] = f
	}
	off(msg)
	{

	}

	_onSocketError = () =>
	{

	}
	_onSocketMessage = () =>
	{
		let mview = new DataView(msg.data)
		let type = mview.getUint16(0)
		let h = this.messageHandlers[type]
		if (h)
		{
			h(mview);
		}
	}

	begin() 		{ this.offset = 0; }
	writeChar(c)	{ this.view.setInt8(this.offset++, c); }
	writeUchar(c)	{ this.view.setUint8(this.offset++, c); }
	writeShort(s)	{ this.view.setInt16(this.offset, s); this.offset += 2; }
	writeUshort(s)	{ this.view.setUint16(this.offset, s); this.offset += 2; }
	writeInt(i)		{ this.view.setInt32(this.offset, i); this.offset += 4; }
	writeUint(i)	{ this.view.setUint32(this.offset, i); this.offset += 4; }
	writeFloat(f)	{ this.view.setFloat32(this.offset, f); this.offset += 4; }
	writeDouble(d)	{ this.view.setFloat64(this.offset, d); this.offset += 8; }
	send() 			{ this.socket.send(this.buffer { binary : true }); }
}
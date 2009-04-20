function BitBuffer(data, bitlen)
{
    this.position = 0;
    if (data instanceof Array)
    {
        this.buffer = data;
        if (bitlen)
        {
            this.length = Math.min(bitlen, this.buffer.length * 8);
        }
        else
        {
            this.length = this.buffer.length * 8;
        }
    }
    else if ((data instanceof String) || (typeof data == "string"))
    {
          this.buffer = [];
          var pos = 0;
          for (var i = 0; i < data.length; ++i)
          {
              var v = parseInt(data.charAt(i), 16);
              if (! isNaN(v))
              {
                  this.buffer[Math.floor(pos/2)] |= v << (((pos + 1) % 2) * 4);
                  pos++;
              }
          }
          this.length = pos * 4;
    }
    else
    {
        this.buffer = [];
        this.length = 0;
    }
    return this;
}

BitBuffer.prototype = {

    seek: function(newPos)
    {
        this.position = Math.max(0, Math.min(newPos, this.length));
    },

    reset: function()
    {
        this.seek(0);
    },

    clear: function()
    {
        this.buffer = [];
        this.position = 0;
        this.length = 0;
    },

    readTwosComplementFixedPoint: function(nbits, nfrac)
    {
        var sgn = this.read(1) ? Math.pow(2, nbits - 1) : 0;
        var tc = this.read(nbits - 1);
        return (tc - sgn) / Math.pow(2, nfrac);
    },

    read: function(bits)
    {
        var front = 8 - (this.position % 8);
        front = Math.min(Math.min(front, bits), this.length - this.position);
        var v = this._readPiece(front);
        bits -= front;

        while(bits > 0 && this.position < this.length)
        {
            var tail = Math.min(8, Math.min(bits, this.length - this.position));
            v = v * Math.pow(2, tail) + this._readPiece(tail);
            bits -= tail;
        }
        return v;
    },

	readUTF8: function(bits) {
		var nbytes = (bits - (bits % 8))/8;
		var str = "";
		var i=0;
		var c=0, c2=0, c3=0;
		
		while ( i < nbytes ) {
 
			c = this.read(8);
 
			if (c < 128) {
				str += String.fromCharCode(c);
				i++;
			}
			else if((c > 191) && (c < 224) && (i < nbytes-1)) {
				c2 = this.read(8);
				str += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			}
			else if((c > 223) && (c < 240)) {
				c2 = this.read(8);
				c3 = this.read(8);
				str += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			} 
 
		}
		
		this.read(bits%8); // Skip any remaining bits
		
		return str;
	},

    _readPiece: function(bits)
    {
        var idx = Math.floor(this.position/8);
        var v = (this.buffer[idx] >> (8 - bits - (this.position % 8))) & (0xff >> (8 - bits));
        this.position += bits;
        return v;
    },

    writeFixedPointTwosComplement: function(value, nbits, nfrac)
    {
        var tc = Math.round(value * Math.pow(2, nfrac));
        if (tc < 0)
        {
            tc += Math.pow(2, nbits);
        }
        this.write(tc, nbits);
    },

    write: function(value, bits)
    {
        var front = 8 - (this.position % 8);
        front = Math.min(front, bits);
        bits -= front;
        var mod = Math.pow(2, bits);
        this._writePiece(value / mod, front);
        value %= mod;

        while(bits >= 8)
        {
            bits -= 8;
            mod = Math.pow(2, bits);
            this._writePiece(value / mod, 8);
            value %= mod;
        }

        this._writePiece(value, bits);
    },

	writeUTF8: function (str) {
		for (var n=0; n<str.length; ++n) {
			var c = str.charCodeAt(n);
 
			if (c < 128) {
				this.write(c, 8);
			}
			else if((c > 127) && (c < 2048)) {
				this.write((c >> 6) | 192, 8);
				this.write((c & 63) | 128, 8);
			}
			else if((c > 2047) && (c < 32768)){
				this.write((c >> 12) | 224, 8);
				this.write(((c >> 6) & 63) | 128, 8);
				this.write((c & 63) | 128, 8);
			} // Higher-order unicode not supported

		}
	},

    _writePiece: function(value, bits)
    {
        if (!bits) { return; } // prevent extra bytes from being added to the array
        var idx = Math.floor(this.position/8);
        this.buffer[idx] |= (value & (0xff >> (8 - bits))) << (8 - bits - (this.position % 8));
        this.position += bits;
        this.length = Math.max(this.position, this.length);
    },

    toString: function()
    {
        var str = '';
        for (var i in this.buffer)
        {
            str += ':';
            str += (this.buffer[i] >> 4).toString(16);
            str += (this.buffer[i] & 0x0f).toString(16);
        }
        return str.substring(1);
    }
};

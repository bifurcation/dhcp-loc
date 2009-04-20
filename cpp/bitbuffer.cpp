#include "bitbuffer.h"

BitBuffer::BitBuffer(size_t bitlen) 
{
	byte_length = (bitlen>>3) + ((bitlen % 8 == 0)? 0 : 1) ;
	buffer = new unsigned char[byte_length];
	length = bitlen;
	position = 0;
}

BitBuffer::BitBuffer(uint8_t *inbuf, size_t len)
{
	byte_length = len;
	buffer = new uint8_t[byte_length];
	length = 8*byte_length;
	position = 0;

	memcpy(buffer, inbuf, byte_length);
}

BitBuffer::BitBuffer(const BitBuffer& bbuf)
{
	byte_length = bbuf.byte_length;
	length = bbuf.length;
	position = 0;

	buffer = new uint8_t[bbuf.byte_length];
	memcpy(buffer, bbuf.buffer, bbuf.byte_length);
}

BitBuffer::~BitBuffer() {
	delete buffer;
}

int BitBuffer::seek(size_t pos)
{
	position = fmax(0, fmin(pos, length));
	return 0;
}

int BitBuffer::reset()
{
	seek(0);
}

int BitBuffer::clear() 
{
	delete buffer;
	position = 0;
	length = 0;
}

uint8_t BitBuffer::readPiece(size_t bits)
{
	size_t idx = position >> 3;
	uint64_t v = (buffer[idx] >> (8-bits-(position%8))) & (0xff >> (8-bits)); 
	position += bits;
	return v;
}

uint64_t BitBuffer::read(size_t bits) 
{
	size_t front = 8 - (position % 8);
	front = fmin( fmin(front, bits), length - position );
	uint64_t v = readPiece(front);
	bits -= front;

	while ((bits > 0)&&(position < length))
	{
		size_t tail = fmin(8, fmin(bits, length-position));
		v = v * exp2(tail) + readPiece(tail);
		bits -= tail;
	}

	return v;
}

double BitBuffer::readTwosComplementFixedPoint(size_t nbits, size_t nfrac)
{
	if (!nbits) return 0;
	double sgn = (read(1))? exp2(nbits - 1) : 0;
	double tc = (double) read(nbits-1);
	return (tc - sgn) / exp2(nfrac);
}

int BitBuffer::writePiece(uint8_t value, size_t bits)
{
	if (!bits || (position + bits > length)) return -1;
	size_t idx = position >> 3;
	buffer[idx] |= (value & (0xff >> (8-bits))) << (8 - bits - (position % 8)); 
	position += bits;
	// Length does not change 
	return 0;
} 

int BitBuffer::write(uint64_t value, size_t bits)
{
	size_t front = 8 - (position % 8);
	front = fmin(front, bits);
	bits -= front;
	uint64_t mod = exp2(bits);
	writePiece( value / mod, front );
	value %= mod;

	while (bits >= 8)
	{
		bits -= 8;
		mod = exp2(bits);
		writePiece(value/mod, 8);
		value %= mod;
	}

	writePiece(value, bits);

	return 0;
}

int BitBuffer::writeTwosComplementFixedPoint(double value, size_t nbits, size_t nfrac)
{
	double tc = value * exp2(nfrac);
	if (tc < 0)
	{
		tc += exp2(nbits);
	}
	write(tc, nbits);
}

char *BitBuffer::toString()
{
	char *buf = new char[3*byte_length+2];

	for (size_t i=0; i<byte_length-1; ++i)
	{
		snprintf(buf + 3*i, 4, "%02x:", buffer[i]);
	}
	snprintf(buf + 3*byte_length - 3, 3, "%02x", buffer[byte_length-1]);

	return buf;
}

/*
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

};

*/


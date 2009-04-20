#ifndef __BITBUFFER_H__
#define __BITBUFFER_H__

#include <stdlib.h>
#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

class BitBuffer 
{
public:
	BitBuffer(size_t bitlen);
	BitBuffer(uint8_t* input, size_t len);
	BitBuffer(const BitBuffer& input);
	~BitBuffer();

	int seek(size_t pos);
	int reset();
	int clear();

	uint64_t read(size_t bits);
	double readTwosComplementFixedPoint(size_t nbits, size_t nfrac);

	int write(uint64_t value, size_t bits);
	int writeTwosComplementFixedPoint(double value, size_t nbits, size_t nfrac);

	char *toString();

	uint8_t readPiece(size_t bits);
	int writePiece(uint8_t value, size_t bits);
private:
	unsigned char *buffer;
	size_t length;
	size_t byte_length;
	size_t position;

};


#endif  /* ndef __BITBUFFER_H__ */

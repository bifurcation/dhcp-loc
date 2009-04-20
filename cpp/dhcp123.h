#ifndef __DHCP123_H__
#define __DHCP123_H__

#include "bitbuffer.h"

class DhcpOption123 
{
public:
	double latitude;
	double longitude;
	double altitude;
	uint8_t latitudeUncertainty;
	uint8_t longitudeUncertainty;
	uint8_t altitudeUncertainty;
	uint8_t altitudeType;
	uint8_t datum;
	uint8_t version;

	BitBuffer encode();
	void decode(BitBuffer input);  
	void decode(uint8_t *input, size_t len);	

	double *getLatitudeRange(bool bis);
	double *getLongitudeRange(bool bis);
	double *getAltitudeRange(bool bis);

	char *getDatum();
	char *getAltitudeType();
	char *toString();

private:	
	static char *DATUMS[];
	static char *ALTITUDE_TYPES[];

	double *getRange(double min, double max, bool bis);
};

#endif // ndef __DHCP123_H__

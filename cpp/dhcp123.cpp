#include "dhcp123.h"

char *DhcpOption123::DATUMS[] = {"", "WGS85", "NAD83 + NAVD88", "NAD83 + MLLW"};
char *DhcpOption123::ALTITUDE_TYPES[] = {"Unknown", "Meters", "Floors"};

BitBuffer DhcpOption123::encode() 
{
	BitBuffer buf(128);
	buf.write(latitudeUncertainty, 6);
	buf.writeTwosComplementFixedPoint(latitude, 34, 25);
	buf.write(longitudeUncertainty, 6);
	buf.writeTwosComplementFixedPoint(longitude, 34, 25);
	buf.write(altitudeType, 4);
	buf.write(altitudeUncertainty, 6);
	buf.writeTwosComplementFixedPoint(altitude, 30, 8);
	buf.write(datum, 8);
	buf.reset();
	return buf;
}


void DhcpOption123::decode(BitBuffer input)
{
	// TODO: Check length of input
	latitudeUncertainty = input.read(6);
        latitude = input.readTwosComplementFixedPoint(34, 25);
        longitudeUncertainty = input.read(6);
        longitude = input.readTwosComplementFixedPoint(34, 25);
        altitudeType = input.read(4);
        altitudeUncertainty = input.read(6);
        altitude = input.readTwosComplementFixedPoint(30, 8);
        datum = input.read(8);
} 

void DhcpOption123::decode(uint8_t *input, size_t len)
{
	decode(BitBuffer(input, len));	
}

double *DhcpOption123::getLatitudeRange(bool bis)
{
	double *range = new double[2];

	if (latitudeUncertainty == 0)
	{
		range[0] = latitude;
		range[1] = latitude;
	} 
	else if (bis)
	{
		double unc = exp2( 8 - latitudeUncertainty );
		range[0] = latitude - unc;
		range[1] = latitude + unc;
	}
	else
	{
		double scale = exp2( 9 - latitudeUncertainty );
		range[0] = trunc(latitude / scale) * scale;
		range[1] = range[0] + scale;
	}

	range[0] = fmax(-90, range[0]);
	range[1] = fmax(90, range[1]);

	return range;
}

double *DhcpOption123::getLongitudeRange(bool bis)
{
	double *range = new double[2];

	if (longitudeUncertainty == 0)
	{
		range[0] = longitude;
		range[1] = longitude;
	}
	else if (bis)
	{
		double unc = exp2( 8 - longitudeUncertainty );
                range[0] = longitude - unc;
                range[1] = longitude + unc;
	}
	else
	{
                double scale = exp2( 9 - longitudeUncertainty );
                range[0] = trunc(longitude / scale) * scale;
                range[1] = range[0] + scale;
	}

	if (range[0] <= -180) { range[0] += 360; }
	if (range[1] > 180) { range[1] -= 360; }

	return range;
}

double *DhcpOption123::getAltitudeRange(bool bis)
{
	double *range = new double[2];

	if (altitudeUncertainty == 0)
	{
		range[0] = altitude;
		range[1] = altitude;
	} 
	else if (bis)
	{
		double unc = exp2( 21 - altitudeUncertainty );
		range[0] = altitude - unc;
		range[1] = altitude + unc;
	}
	else 
	{
		double scale = exp2( 22 - altitudeUncertainty );
		range[0] = trunc(altitude / scale) * scale;
		range[1] = range[0] + scale;
	}

	return range;
}

char *DhcpOption123::getDatum()
{
	return DATUMS[datum];
}

char *DhcpOption123::getAltitudeType()
{
	return ALTITUDE_TYPES[altitudeType];
}

char *printRange(double center, double *range) 
{
	size_t maxlen = 256;
	char *buffer = new char[maxlen];
	snprintf(buffer, maxlen, "%f : (%f, %f)", center, range[0], range[1]);
	return buffer;
}

char *DhcpOption123::toString() 
{
	size_t maxlen = 512;
	char *buffer = new char[maxlen];
	snprintf(buffer, maxlen, "Lat/long/alt: %f, %f, %f \nUncertainty: %d, %d, %d \nAltitudeType: %s\nDatum: %s", 
		latitude, longitude, altitude,
		latitudeUncertainty, longitudeUncertainty, altitudeUncertainty,
		getAltitudeType(),
		getDatum());
	return buffer;
}

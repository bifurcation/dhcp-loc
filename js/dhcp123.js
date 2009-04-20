function DhcpOption123()
{
    return this;
}

DhcpOption123.DATUMS = { 1: 'WGS84', 2: 'NAD83 + NAVD88', 3: 'NAD83 + MLLW' };
DhcpOption123.ALTITUDE_TYPES = { 0: 'Unknown', 1: 'Metres', 2: 'Floors' };
DhcpOption123.prototype = {
    encode: function()
    {
        buf = new BitBuffer();
        buf.write(this.latitudeUncertainty, 6);
        buf.writeFixedPointTwosComplement(this.latitude, 34, 25);
        buf.write(this.longitudeUncertainty, 6);
        buf.writeFixedPointTwosComplement(this.longitude, 34, 25);
        buf.write(this.altitudeType, 4);
        buf.write(this.altitudeUncertainty, 6);
        buf.writeFixedPointTwosComplement(this.altitude, 30, 8);
        buf.write(this.datum, 8);
        buf.reset();
        return buf;
    },

    decode: function(input)
    {
        var buf;
        if (input instanceof BitBuffer)
        {
            buf = input;
        }
        else
        {
            buf = new BitBuffer(input);
        }

        this.latitudeUncertainty = buf.read(6);
        this.latitude = buf.readTwosComplementFixedPoint(34, 25);
        this.longitudeUncertainty = buf.read(6);
        this.longitude = buf.readTwosComplementFixedPoint(34, 25);
        this.altitudeType = buf.read(4);
        this.altitudeUncertainty = buf.read(6);
        this.altitude = buf.readTwosComplementFixedPoint(30, 8);
        this.datum = buf.read(8);
    },

    getLatitudeRange: function(bis)
    {
        if (this.latitudeUncertainty == 0)
        {
            return this.latitude;
        }
        var range = { min: 0, max: 0 };
        if (bis)
        {
            var unc = Math.pow(2, 8 - this.latitudeUncertainty);
            range.min = this.latitude - unc;
            range.max = this.latitude + unc;
        }
        else
        {
            var scale = Math.pow(2, 9 - this.latitudeUncertainty);
            range.min = Math.floor(this.latitude / scale) * scale;
            range.max = range.min + scale;
        }
        range.min = Math.max(-90, range.min);
        range.max = Math.min(range.max, 90);
        return range;
    },

    getLongitudeRange: function(bis)
    {
        if (this.longitudeUncertainty == 0)
        {
            return this.longitude;
        }
        var range = { min: 0, max: 0 };
        if (bis)
        {
            var unc = Math.pow(2, 8 - this.longitudeUncertainty);
            range.min = this.longitude - unc;
            range.max = this.longitude + unc;
        }
        else
        {
            var scale = Math.pow(2, 9 - this.longitudeUncertainty);
            range.min = Math.floor(this.longitude / scale) * scale;
            range.max = range.min + scale;
        }
        if (range.min <= -180) { range.min += 360; }
        if (range.max > 180) { range.max -= 360; }
        return range;
    },

    getAltitudeRange: function(bis)
    {
        if (this.altitudeUncertainty == 0)
        {
            return this.altitude;
        }
        if (bis)
        {
            var unc = Math.pow(2, 21 - this.altitudeUncertainty);
            return { min: this.altitude - unc, max: this.altitude + unc };
        }

        var range = { min: 0, max: 0 };
        var scale = Math.pow(2, 22 - this.altitudeUncertainty);
        range.min = Math.floor(this.altitude / scale) * scale;
        range.max = range.min + scale;
        return range;
    },

    getDatum: function()
    {
        return DhcpOption123.DATUMS[this.datum];
    },

    getAltitudeType: function()
    {
        return DhcpOption123.ALTITUDE_TYPES[this.altitudeType];
    },

    _printRange: function(centre, range, bis)
    {
        return '' + centre + ((centre == range) ? '' : ((bis ? ' (' : ' [') + range.min + ',' + range.max + ')'));
    },

    toString: function(bis)
    {
        str = 'Latitude: ' + this._printRange(this.latitude, this.getLatitudeRange(bis), bis);
        str += ', Longitude: ' + this._printRange(this.longitude, this.getLongitudeRange(bis), bis);
        str += ', Altitude: ' + ((this.altitudeType != 0) ? this._printRange(this.altitude, this.getAltitudeRange(bis), bis) : '') + ' ' + this.getAltitudeType();
        str += ', Datum: ' + this.getDatum();
        return str;
    }
};

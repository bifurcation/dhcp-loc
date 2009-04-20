function DhcpOption99() 
{
	this.catypes = new Array();
	return this;
}

DhcpOption99.WHAT = {0: "DHCP Server", 1: "Network Element", 2: "Client"};
DhcpOption99.CATYPES = {
		0: "language",
		1: "A1",
		2: "A2",
		3: "A3",
		4: "A4",
		5: "A5",
		6: "A6",
		16: "PRD",
		17: "POD",
		18: "STS",
		19: "HNO",
		20: "HNS",
		21: "LMK",
		22: "LOC",
		23: "NAM",
		24: "PC",
		25: "BLD",
		26: "UNIT",
		27: "FLR",
		28: "ROOM",
		29: "PLC",
		30: "PCN",
		31: "POBOX",
		32: "ADDCODE",
		33: "SEAT",
		34: "RD",
		35: "RDSEC",
		36: "RDBR",
		37: "RDSUBBR",
		38: "PRM",
		39: "POM",
		128: "script"
	};	
DhcpOption99.prototype = {
	
	what: null,		// "what" value, as an in
	country: null,  // Country, as two ASCII characters
	catypes: new Array(),	// List of CAtype {type, value} pairs
	
	encode: function() {
		var buf = new BitBuffer();
		buf.write(this.what, 8);
		buf.write(this.country.charCodeAt(0), 8);
		buf.write(this.country.charCodeAt(1), 8);
		
		for (var i=0; i < this.catypes.length; ++i) {
			var catype = this.catypes[i];
			buf.write(catype.type, 8);
			buf.write(this._utf8len(catype.value), 8);
			buf.writeUTF8(catype.value);
		}
		
		return buf;
	},
	
	decode: function(input) {
		var buf;
		var bits, bitsLeft;
		
		if (input instanceof BitBuffer)
		{
		    buf = input;
		}
		else
		{
		    buf = new BitBuffer(input);
		}
		
		bits = bitsLeft = buf.length;
		
		this.what = buf.read(8);
		bitsLeft -= 8;
		
		this.country = "";
		this.country += String.fromCharCode(buf.read(8));
		this.country += String.fromCharCode(buf.read(8));
		bitsLeft -= 16;
		
		this.catypes = new Array();
		while (bitsLeft >= 2*8) {
			var type = buf.read(8);
			var len = buf.read(8);
			var val = buf.readUTF8(8 * len);
			this.pushCAtype(type, val);
			bitsLeft -= 16 + 8*len;
		}
	},

	clear: function() {
		this.what = null;
		this.country = null;
		this.catypes = new Array();
	},

	pushCAtype: function(type, val) {
		this.catypes.push({type: type, value: val});
	},

	popCAtype: function() {
		return this.catypes.pop();
	},
	
	toString: function() {
		var out = "";
		out += "Location of "+ DhcpOption99.WHAT[this.what];
		out += ": Country="+this.country;
		for (var i=0; i<this.catypes.length; ++i) {
			var type = this.catypes[i];
			out += " ("+DhcpOption99.CATYPES[type.type]+"="+type.value+")";
		}
		return out;
	},
	
	// Convenience function for the number of octets in a UTF8 string
	_utf8len : function(str) {
		var len = 0;
		
		for (var n = 0; n < str.length; n++) {
			var c = str.charCodeAt(n);
 
			if (c < 128) { len += 1; }
			else if((c > 127) && (c < 2048)) { len += 2; }
			else if((c > 2047) && (c < 32768)) { len += 3; }
			else { len += 4; }
		}
		
		return len;
	}
};

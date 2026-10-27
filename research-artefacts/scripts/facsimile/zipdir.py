"""List entries of a zip from a tail fragment containing the central directory."""
import struct
import sys

data = open(sys.argv[1], "rb").read()
total = int(sys.argv[2])
offset_of_tail = total - len(data)
eocd = data.rfind(b"PK\x05\x06")
n_entries, cd_size, cd_off = struct.unpack("<HII", data[eocd + 10: eocd + 20])
if cd_off == 0xFFFFFFFF:
    loc = data.rfind(b"PK\x06\x07")
    z64 = struct.unpack("<Q", data[loc + 8: loc + 16])[0]
    rec = data[z64 - offset_of_tail:]
    n_entries = struct.unpack("<Q", rec[32:40])[0]
    cd_size = struct.unpack("<Q", rec[40:48])[0]
    cd_off = struct.unpack("<Q", rec[48:56])[0]
print("entries", n_entries, "cd_off", cd_off, "in tail:", cd_off >= offset_of_tail)
p = cd_off - offset_of_tail
for _ in range(n_entries):
    if data[p:p + 4] != b"PK\x01\x02":
        print("bad sig at", p)
        break
    csize, usize, nlen, elen, clen = struct.unpack("<IIHHH", data[p + 20: p + 34])
    name = data[p + 46: p + 46 + nlen].decode("utf-8", "replace")
    print(usize, name)
    p += 46 + nlen + elen + clen

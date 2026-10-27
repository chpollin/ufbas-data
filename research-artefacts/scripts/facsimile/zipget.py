"""Fetch single members of a remote zip by HTTP range, using a local tail containing the central directory."""
import struct
import sys
import urllib.request
import zlib

URL = "https://zenodo.org/api/records/5153263/files/StABS_Ratsbuch_O_10.zip/content"
TOTAL = 178043961
data = open("tail.bin", "rb").read()
off_tail = TOTAL - len(data)
eocd = data.rfind(b"PK\x05\x06")
n, cd_size, cd_off = struct.unpack("<HII", data[eocd + 10: eocd + 20])
p = cd_off - off_tail
entries = {}
for _ in range(n):
    method = struct.unpack("<H", data[p + 10: p + 12])[0]
    csize, usize, nlen, elen, clen = struct.unpack("<IIHHH", data[p + 20: p + 34])
    lho = struct.unpack("<I", data[p + 42: p + 46])[0]
    name = data[p + 46: p + 46 + nlen].decode("utf-8", "replace")
    entries[name] = (method, csize, lho)
    p += 46 + nlen + elen + clen

for name in sys.argv[1:]:
    method, csize, lho = entries[name]
    req = urllib.request.Request(URL, headers={"Range": f"bytes={lho}-{lho + csize + 30 + 400}"})
    blob = urllib.request.urlopen(req).read()
    nlen, elen = struct.unpack("<HH", blob[26:30])
    raw = blob[30 + nlen + elen: 30 + nlen + elen + csize]
    content = zlib.decompress(raw, -15) if method == 8 else raw
    out = name.replace("/", "_")
    open(out, "wb").write(content)
    print(name, len(content), "->", out)

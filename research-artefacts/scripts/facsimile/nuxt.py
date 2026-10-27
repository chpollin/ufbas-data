# Unpack the window.__NUXT__ state of a saved copy of the archived Lesesaal page (argument 1), print the
# parameters named in argument 3 (comma-separated) and the state text around the string in argument 2.
# Exploratory, prints only, no table.
import re
import sys

s = open(sys.argv[1], encoding="utf-8").read()
m = re.search(r"window\.__NUXT__=\(function\(([^)]*)\)\{(.*)\}\((.*)\)\);?</script>", s, re.S)
params = m.group(1).split(",")
args = m.group(3)
out, cur, depth, q, esc = [], "", 0, None, False
BS = chr(92)
for ch in args:
    if q:
        cur += ch
        if esc:
            esc = False
        elif ch == BS:
            esc = True
        elif ch == q:
            q = None
        continue
    if ch in "\"'":
        q = ch
        cur += ch
        continue
    if ch in "[{(":
        depth += 1
    if ch in "]})":
        depth -= 1
    if ch == "," and depth == 0:
        out.append(cur)
        cur = ""
        continue
    cur += ch
out.append(cur)
mp = dict(zip(params, out))
for k in sys.argv[3].split(","):
    print(k, "=", mp.get(k, "?")[:300])
body = m.group(2)
i = body.find(sys.argv[2])
print(body[max(0, i - 300): i + 1200])

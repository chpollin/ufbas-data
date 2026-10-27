# Print the entries whose reading text matches the regex in argument 1, with page, date, heading and the
# match in context, from the feature table of features.py. Exploratory, used while writing the rules of
# typology.py.
import sys, re
sys.stdout.reconfigure(encoding="utf-8")
from features import rows
pat = sys.argv[1]
for r in rows:
    if re.search(pat, r["full"], re.I):
        print(r["id"], r["page"], r["date"], "|", r["head"][:80], "|", re.search(".{0,60}(" + pat + ").{0,60}", r["full"], re.I).group(0))

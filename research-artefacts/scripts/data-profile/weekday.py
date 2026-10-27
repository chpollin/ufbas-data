# Julian-calendar weekday of the written dates behind the @when disagreements.
WD = ["Montag", "Zinstag", "Mittwoch", "Donstag", "Fritag", "Sambstag", "Sontag"]
def jdn(y, m, d):
    a = (14 - m) // 12; yy = y + 4800 - a; mm = m + 12 * a - 3
    return d + (153 * mm + 2) // 5 + 365 * yy + yy // 4 - 32083
cases = [("Eintrag-102 written Sambstag 26 Jan 65", 1565, 1, 26), ("Eintrag-102 coded", 1565, 1, 27),
         ("Eintrag-155 written Donstag 24 May 65", 1565, 5, 24), ("Eintrag-232 written Mittwoch 24 Oct 65", 1565, 10, 24),
         ("Eintrag-257 written Sambstag 5 Jan 66", 1566, 1, 5), ("Eintrag-266 written Sambstag 16 Feb 66", 1566, 2, 16),
         ("Eintrag-270 written Mittwoch 20 Feb 66", 1566, 2, 20), ("Eintrag-476 written Mittwoch 26 May 68", 1568, 5, 26),
         ("Eintrag-490 written Mittwoch 26 Jun 68", 1568, 6, 26), ("Eintrag-505 written Sambstag 7 Aug 68", 1568, 8, 7),
         ("Eintrag-622 written 30 Nov 69", 1569, 11, 30), ("Eintrag-536 written Mentag 17 Jan '68'", 1569, 1, 17),
         ("check 1 Jan 1564 (New Year)", 1564, 1, 1), ("Eintrag-146 Tat Mentag nach Neujahr -> 1564-01-03", 1564, 1, 3)]
for c in cases:
    print(c[0], "->", WD[jdn(*c[1:]) % 7])

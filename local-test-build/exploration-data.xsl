<?xml version="1.0" encoding="UTF-8"?>
<!--
    Project: ufbas, TEI reference of the Exploration view
    Turns the edition o:ufbas.1563 (input document) and the taxonomy o:ufbas.kategorien
    (parameter taxonomy-doc) into one compact JSON text: the categories with their group,
    and per entry its date, folio, offenders and annotations.

    XSLT 2.0 on purpose, so that it can also run on GAMS: JSON is written as text with
    an own string escaping instead of the 3.0 functions.

    Labels, folios, the entry type and the fragments come from the rules of
    ufbas-TORDF-ontology.xsl, so the dataset and the refactored RDF agree on them
    (ADR-12). A label follows uf:label of ufbas-object.xsl (words split by lb or pb with
    break="no" joined, notes left out, the Kringel and Blume marks read as a space,
    expansions in tei:ex read as plain text without the brackets of the edition page),
    but leaves out deleted text (tei:del), so it gives the reading text. Every record
    carries its type, and a fragment adds its offenders and annotations to the entry it
    continues instead of standing as a record of its own.

    The gender rule differs from the derivation. Here a male token on the person or any
    of its own forenames wins, where the derivation takes the token on the person first
    (knowledge/data.md).
-->
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:uf="http://gams.uni-graz.at/ufbas/#" xmlns:t="http://www.tei-c.org/ns/1.0"
    xmlns:d="urn:x-ufbas:tordf-ontology"
    xmlns:xs="http://www.w3.org/2001/XMLSchema" exclude-result-prefixes="#all" version="2.0">

    <xsl:import href="../ufbas-TORDF-ontology.xsl"/>

    <xsl:output method="text" encoding="UTF-8"/>

    <!-- the default mirrors the document() call of the page stylesheets on GAMS; named
         apart from $taxonomy of the imported derivation, which it would otherwise hide -->
    <xsl:param name="taxonomy-doc" select="document('/o:ufbas.kategorien/TEI_SOURCE')"/>
    <xsl:param name="generated" select="string(current-date())"/>

    <xsl:variable name="groups" select="('Person', 'Tat', 'Strafe', 'Ort', 'Schlagwort', 'Datum')"/>
    <xsl:variable name="categories" select="$taxonomy-doc//t:taxonomy[@xml:id = 'Urfehdekodierung']//t:category[uf:term(.) != '']"/>

    <xsl:key name="category" match="t:category" use="@xml:id"/>

    <xsl:template match="/">
        <xsl:text>{"source":{"edition":</xsl:text>
        <xsl:value-of select="uf:json(string(/t:TEI/t:teiHeader/t:fileDesc/t:publicationStmt/t:idno[@type = 'PID']))"/>
        <xsl:text>,"taxonomy":</xsl:text>
        <xsl:value-of select="uf:json(string($taxonomy-doc/t:TEI/t:teiHeader/t:fileDesc/t:publicationStmt/t:idno[@type = 'PID']))"/>
        <xsl:text>,"generated":</xsl:text>
        <xsl:value-of select="uf:json(substring($generated, 1, 10))"/>
        <xsl:text>},"categories":[</xsl:text>
        <xsl:for-each select="$categories">
            <xsl:if test="position() gt 1">,</xsl:if>
            <xsl:text>{"id":</xsl:text>
            <xsl:value-of select="uf:json(uf:short-id(@xml:id))"/>
            <xsl:text>,"term":</xsl:text>
            <xsl:value-of select="uf:json(uf:term(.))"/>
            <xsl:text>,"group":</xsl:text>
            <xsl:value-of select="uf:json(uf:group(.))"/>
            <xsl:text>,"gloss":</xsl:text>
            <xsl:value-of select="uf:json(normalize-space(t:catDesc/t:gloss))"/>
            <xsl:text>}</xsl:text>
        </xsl:for-each>
        <xsl:text>],"entries":[</xsl:text>
        <xsl:for-each select="/t:TEI/t:text/t:body//t:div[@ana = '#uf_Eintrag'][not(@xml:id = $hosts/@id)]">
            <xsl:if test="position() gt 1">,</xsl:if>
            <xsl:apply-templates select="." mode="entry"/>
        </xsl:for-each>
        <xsl:text>]}</xsl:text>
    </xsl:template>

    <xsl:template match="t:div" mode="entry">
        <xsl:variable name="fragments" select="key('entry', $hosts[@host = current()/@xml:id]/@id)"/>
        <xsl:variable name="parts" select=". | $fragments"/>
        <xsl:variable name="date" select="string(($parts//t:date[tokenize(@ana, '\s+') = '#uf_DatumUrfehde']/@when)[1])"/>
        <xsl:variable name="pb" select="preceding::t:pb[1]"/>
        <xsl:text>{"id":</xsl:text>
        <xsl:value-of select="uf:json(string(@xml:id))"/>
        <xsl:text>,"type":</xsl:text>
        <xsl:value-of select="uf:json(string($entry-index[@id = current()/@xml:id]/@type))"/>
        <xsl:if test="$fragments">
            <xsl:text>,"fragments":[</xsl:text>
            <xsl:value-of select="string-join(for $f in $fragments return uf:json(string($f/@xml:id)), ',')"/>
            <xsl:text>]</xsl:text>
        </xsl:if>
        <xsl:text>,"date":</xsl:text>
        <xsl:value-of select="if ($date != '') then uf:json($date) else 'null'"/>
        <xsl:text>,"folio":</xsl:text>
        <xsl:value-of select="if ($pb) then uf:json(d:folio($pb)) else 'null'"/>
        <xsl:text>,"offenders":[</xsl:text>
        <xsl:for-each select="$parts//t:persName[tokenize(@ana, '\s+') = '#uf_PersonTäter']">
            <xsl:if test="position() gt 1">,</xsl:if>
            <xsl:text>{"label":</xsl:text>
            <xsl:value-of select="uf:json(d:label(.))"/>
            <xsl:text>,"gender":</xsl:text>
            <xsl:value-of select="uf:gender(.)"/>
            <xsl:text>}</xsl:text>
        </xsl:for-each>
        <xsl:text>],"annotations":[</xsl:text>
        <!-- One per annotated element and category. Left out are tokens that name no
             category with a term (uf_Eingangsnotiz, stray values) and the gender tokens
             uf_male and uf_female on forenames: they are a person attribute, as in the
             RDF (uf:gender) and the category panel of the edition, and carried by the
             offenders here. As annotations they would add one entry per forename and
             take the file over 1 MB. -->
        <xsl:variable name="annotations" as="xs:string*">
            <xsl:for-each select="$parts//*[@ana]">
                <xsl:variable name="text" select="uf:json(d:label(.))"/>
                <xsl:for-each select="distinct-values(for $token in tokenize(normalize-space(@ana), ' ') return substring-after($token, '#'))">
                    <xsl:if test="not(. = ('uf_male', 'uf_female')) and key('category', ., $taxonomy-doc)[uf:term(.) != '']">
                        <xsl:sequence select="concat('{&quot;category&quot;:', uf:json(uf:short-id(.)), ',&quot;text&quot;:', $text, '}')"/>
                    </xsl:if>
                </xsl:for-each>
            </xsl:for-each>
        </xsl:variable>
        <xsl:value-of select="string-join($annotations, ',')"/>
        <xsl:text>]}</xsl:text>
    </xsl:template>

    <!-- m, f or null, from the person or the forenames that belong to it directly -->
    <xsl:function name="uf:gender" as="xs:string">
        <xsl:param name="person" as="element()"/>
        <xsl:variable name="tokens" select="for $e in ($person, $person//t:forename[ancestor::t:persName[1] is $person]) return tokenize($e/@ana, '\s+')"/>
        <xsl:sequence select="
            if ($tokens = '#uf_male') then '&quot;m&quot;'
            else if ($tokens = '#uf_female') then '&quot;f&quot;'
            else 'null'"/>
    </xsl:function>

    <!-- taxonomy -->

    <xsl:function name="uf:term" as="xs:string">
        <xsl:param name="category" as="element()"/>
        <xsl:sequence select="normalize-space($category/t:catDesc/t:term)"/>
    </xsl:function>

    <xsl:function name="uf:short-id" as="xs:string">
        <xsl:param name="id" as="xs:string"/>
        <xsl:sequence select="if (starts-with($id, 'uf_')) then substring($id, 4) else $id"/>
    </xsl:function>

    <!-- the named group of the top-level ancestor, the group itself for a group
         category, and Weitere for top-level categories outside the groups -->
    <xsl:function name="uf:group" as="xs:string">
        <xsl:param name="category" as="element()"/>
        <xsl:variable name="top" select="uf:short-id(string(($category/ancestor-or-self::t:category)[1]/@xml:id))"/>
        <xsl:sequence select="if ($top = $groups) then $top else 'Weitere'"/>
    </xsl:function>

    <!-- JSON -->

    <!-- a JSON string literal: quote, backslash and every control character escaped -->
    <xsl:function name="uf:json" as="xs:string">
        <xsl:param name="text" as="xs:string"/>
        <xsl:variable name="escaped">
            <xsl:analyze-string select="$text" regex="[&quot;\\\p{{Cc}}]">
                <xsl:matching-substring>
                    <xsl:variable name="c" select="string-to-codepoints(.)"/>
                    <xsl:value-of select="
                        if ($c = 34) then '\&quot;'
                        else if ($c = 92) then '\\'
                        else if ($c = 10) then '\n'
                        else if ($c = 13) then '\r'
                        else if ($c = 9) then '\t'
                        else concat('\u', string-join(for $d in (4096, 256, 16, 1) return substring('0123456789abcdef', ($c idiv $d) mod 16 + 1, 1), ''))"/>
                </xsl:matching-substring>
                <xsl:non-matching-substring>
                    <xsl:value-of select="."/>
                </xsl:non-matching-substring>
            </xsl:analyze-string>
        </xsl:variable>
        <xsl:sequence select="concat('&quot;', string($escaped), '&quot;')"/>
    </xsl:function>

</xsl:stylesheet>

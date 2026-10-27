<?xml version="1.0" encoding="UTF-8"?>
<!--
    Project: ufbas, refactored RDF of the edition and concept scheme of the taxonomy
    Turns the TEI of o:ufbas.1563 into RDF/XML whose data use only the terms of
    data/ontology/ufbas.ontology.ttl and the GAMS ontology (knowledge/domain.md#domain-ontology,
    ADR-17, ADR-23), held to data/ontology/ufbas.shapes.ttl, and the TEI of o:ufbas.kategorien
    into the SKOS of the taxonomy. Meant to run in Cirilo as the TORDF transformation of
    cirilo:ufbas, which both objects inherit, so it reads nothing but its input document.

    XSLT 2.0, because GAMS runs Saxon in 2.0.

    Every derived node gets a deterministic IRI, a lower-case class prefix and the xml:id of
    the span it is derived from, so the same TEI always gives the same graph and the nodes
    keep their IRIs across re-ingests. A span coded with two categories of one kind, such as
    two offences, gives one node per category, the first under the plain IRI and every
    further one with the category appended.

    Rules with interpretive weight, each stated where it is applied:
    - A span keeps the coding of its @ana as ufbas-ont:category, a derived node carries the
      one category that made it. Keywords, person attributes and place roles have no node of
      their own and stay on the span.
    - committedBy and appliesTo only where the entry has exactly one offender (d:single-offender).
    - Offence place and date: enclosing offence, else single offence of the entry, else the
      proceeding (d:targets). The Urfehde date likewise with the oath.
    - An unannotated @dur belongs to the enclosing date span, else to the nearest enclosing
      detention or sanction (d:duration-owner).
    - An amount concerns the nearest enclosing offence or sanction, else, outside any span, the
      proceeding. Outside any span it is derived from its entry.
    - A marginal note holds one claim per annotated element in it, with the first num after it.
    - The gender of a person is the gender token on the person, else that of its forenames.
    - The text of an entry or span is its reading text, with the marginal notes of the
      manuscript and without the editors' notes and deleted text. Names leave every note out.
    - The entry type, five rules after the introduction of the edition (d:entry-type).
    - A fragment documents the proceeding of the entry its note cites (ADR-12).
    - The editors' cross-references resolve by cited folio and heading (d:resolve), a
      candidate person link only where the name of the note matches in both entries.
    - A coded date that contradicts its written form or its entry gets the kind of conflict
      and, where one follows, a suggested date beside it (d:date-conflicts).
-->
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:t="http://www.tei-c.org/ns/1.0"
    xmlns:d="urn:x-ufbas:tordf-ontology"
    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    xmlns:ufbas="http://gams.uni-graz.at/o:ufbas.1563#"
    xmlns:ufbas-ont="https://gams.uni-graz.at/o:ufbas.ontology#"
    xmlns:ufbas-kat="http://gams.uni-graz.at/ufbas/#"
    xmlns:gams="http://gams.uni-graz.at/o:gams-ontology#"
    xmlns:skos="http://www.w3.org/2004/02/skos/core#"
    exclude-result-prefixes="xs t d" version="2.0">

    <xsl:output method="xml" encoding="UTF-8" indent="yes"/>

    <xsl:variable name="pid" select="normalize-space(/t:TEI/t:teiHeader/t:fileDesc/t:publicationStmt/t:idno[@type = 'PID'])"/>
    <xsl:variable name="data" select="concat('http://gams.uni-graz.at/', $pid, '#')"/>
    <xsl:variable name="ont" select="'https://gams.uni-graz.at/o:ufbas.ontology#'"/>
    <xsl:variable name="kat" select="'http://gams.uni-graz.at/ufbas/#'"/>
    <xsl:variable name="xsd" select="'http://www.w3.org/2001/XMLSchema#'"/>
    <xsl:variable name="volume" select="concat($data, 'Urfehdebuch-', tokenize(normalize-space(/t:TEI/t:teiHeader//t:msIdentifier/t:msName), ' ')[last()])"/>

    <xsl:variable name="entries" select="/t:TEI/t:text/t:body//t:div[@ana = '#uf_Eintrag']"/>
    <xsl:variable name="pbs" select="/t:TEI/t:text//t:pb"/>
    <xsl:variable name="counted-pages" select="$pbs[not(@n)]"/>
    <!-- the spans of each entry, indexed once, since several rules look at all of them -->
    <xsl:key name="spans" match="*[d:is-span(.)]" use="generate-id(d:entry(.))"/>
    <xsl:key name="places" match="t:back//t:place" use="@xml:id"/>
    <xsl:key name="entry" match="t:div[@ana = '#uf_Eintrag']" use="@xml:id"/>
    <xsl:variable name="root" select="/"/>

    <!-- Folio and position of every page break, computed once, since the cross-references
         look pages up by folio and by their distance in the book. -->
    <xsl:variable name="page-index" as="element()*">
        <xsl:for-each select="$pbs">
            <d:p id="{generate-id()}" folio="{d:folio(.)}" pos="{position()}"/>
        </xsl:for-each>
    </xsl:variable>

    <!-- One record per entry with what the entry type and the resolution of the editors'
         cross-references read: its folios, the first position of each in the book, its
         heading and the start of its text in the normalised form of d:norm. -->
    <xsl:variable name="entry-index" as="element()*">
        <xsl:for-each select="$entries">
            <xsl:variable name="ids" select="for $p in (preceding::t:pb[1], .//t:pb) return generate-id($p)"/>
            <xsl:variable name="folios" select="distinct-values($page-index[@id = $ids]/@folio)"/>
            <xsl:variable name="full" select="d:label(.)"/>
            <d:e id="{@xml:id}" n="{position()}" folios="{$folios}"
                poss="{for $f in $folios return ($page-index[@folio = $f])[1]/@pos}"
                head="{if (t:head) then d:norm(d:label(t:head[1])) else ''}"
                text="{substring(d:norm($full), 1, 400)}" type="{d:entry-type(., $full)}"/>
        </xsl:for-each>
    </xsl:variable>

    <!-- The editors' cross-references, one d:x per cited entry, and the candidate person
         links of the notes on other proceedings as d:same (knowledge/domain.md#persons). -->
    <xsl:variable name="xrefs" as="element()*">
        <xsl:for-each select="$entries">
            <xsl:variable name="entry" select="."/>
            <xsl:for-each select=".//t:note[@resp = '#editor']">
                <xsl:call-template name="xref">
                    <xsl:with-param name="entry" select="$entry"/>
                </xsl:call-template>
            </xsl:for-each>
        </xsl:for-each>
    </xsl:variable>

    <!-- A fragment documents the proceeding of the entry its own note cites (ADR-12). -->
    <xsl:variable name="hosts" as="element()*">
        <xsl:for-each select="$entry-index[@type = 'fortsetzung']">
            <xsl:variable name="host" select="$xrefs[self::d:x][@src = current()/@id][@kind = ('continuation', 'statement')][@target != ''][1]/@target"/>
            <xsl:if test="$host">
                <d:h id="{@id}" host="{$host}"/>
            </xsl:if>
        </xsl:for-each>
    </xsl:variable>

    <!-- the kinds of part of a proceeding: the prefix of their IRI, their class, and the
         categories that make them, by id prefix or by id -->
    <xsl:variable name="kinds" as="element()*">
        <kind prefix="offence" class="Offence" starts="Tat"/>
        <kind prefix="sanction" class="Sanction" starts="Strafe"/>
        <kind prefix="detention" class="Detention" cats="Untersuchungshaft"/>
        <kind prefix="oath" class="Oath" cats="Urfehdeeid"/>
        <kind prefix="priorinstance" class="PriorInstance" cats="Vorinstanz"/>
        <!-- a reference in the text; the proceeding it names is resolved only from the
             editors' notes, as refersToProceeding -->
        <kind prefix="reference" class="ProceedingReference" cats="FrüheresUrfehdeverfahren AnderesUrfehdeverfahren"/>
    </xsl:variable>
    <!-- the role categories and the proceeding properties they become -->
    <xsl:variable name="roles" as="element()*">
        <role cat="PersonTäter" property="hasOffender"/>
        <role cat="PersonMittäter" property="hasAccomplice"/>
        <role cat="PersonOpfer" property="hasVictim"/>
        <role cat="PersonKläger" property="hasPlaintiff"/>
        <role cat="PersonZeuge" property="hasWitness"/>
        <role cat="PersonAnwesende" property="hasPresent"/>
        <role cat="PersonHehler" property="hasReceiver"/>
        <role cat="PersonNotar" property="hasNotary"/>
    </xsl:variable>
    <xsl:variable name="attributes" as="element()*">
        <attribute cat="Beruf" property="occupation"/>
        <attribute cat="Status" property="status"/>
        <attribute cat="Zivilstand" property="civilStatus"/>
        <attribute cat="Verwandtschaftsgrad" property="kinship"/>
        <attribute cat="Beiname" property="byname"/>
    </xsl:variable>
    <!-- keywords that name the guard entitled to the Turmlöse in a marginal note -->
    <xsl:variable name="guards" select="('SchlagwortRatsknecht', 'SchlagwortStadtknecht', 'SchlagwortObersterKnecht')"/>

    <!-- One stylesheet for both objects, since Cirilo gives every TEI object of the project
         the TORDF of cirilo:ufbas, as in 2017: the taxonomy becomes the concept scheme, the
         edition its data. -->
    <xsl:template match="/">
        <xsl:choose>
            <xsl:when test="$taxonomy">
                <xsl:call-template name="concept-scheme"/>
            </xsl:when>
            <xsl:when test="$entries">
                <xsl:call-template name="edition"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:message terminate="yes">Neither the taxonomy Urfehdekodierung nor entries in the input.</xsl:message>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <xsl:template name="edition">
        <rdf:RDF>
            <rdf:Description rdf:about="{$volume}">
                <rdf:type rdf:resource="{$ont}Volume"/>
            </rdf:Description>
            <xsl:apply-templates select="$entries" mode="entry"/>
            <xsl:apply-templates select="$pbs" mode="page"/>
            <!-- Another proceeding of a person the editors cite, and the person mentions the
                 note names in both entries. A citation of an entry that documents the same
                 proceeding, a fragment and its host, states nothing new and is left out. -->
            <xsl:for-each-group select="$xrefs[self::d:x][@kind = 'person'][@target != '']" group-by="concat(@src, ' ', @target)">
                <xsl:variable name="from" select="d:proceeding(key('entry', @src, $root))"/>
                <xsl:variable name="to" select="d:proceeding(key('entry', @target, $root))"/>
                <xsl:if test="$from != $to">
                    <rdf:Description rdf:about="{$from}">
                        <ufbas-ont:refersToProceeding rdf:resource="{$to}"/>
                    </rdf:Description>
                </xsl:if>
            </xsl:for-each-group>
            <xsl:for-each-group select="$xrefs[self::d:same]" group-by="concat(@from, ' ', @to)">
                <rdf:Description rdf:about="{$data}person-{@from}">
                    <ufbas-ont:possiblySameAs rdf:resource="{$data}person-{@to}"/>
                </rdf:Description>
            </xsl:for-each-group>
            <!-- The places the entries refer to, at the IRIs of the RDF of 2017, with the modern
                 name of the place list, which is all it gives. -->
            <xsl:for-each select="distinct-values($entries//t:placeName[@ref]/d:ref(.))">
                <xsl:variable name="name" select="normalize-space(key('places', substring-after(., $data), $root)/t:placeName[1])"/>
                <rdf:Description rdf:about="{.}">
                    <rdf:type rdf:resource="{$ont}Place"/>
                    <xsl:if test="$name != ''">
                        <ufbas-ont:placeName>
                            <xsl:value-of select="$name"/>
                        </ufbas-ont:placeName>
                    </xsl:if>
                </rdf:Description>
            </xsl:for-each>
        </rdf:RDF>
    </xsl:template>

    <!-- concept scheme of the taxonomy -->

    <!-- The SKOS of the taxonomy Urfehdekodierung of o:ufbas.kategorien. It replaces the SKOS
         part of ufbas-TORDF.xsl, which writes skos:defintion and no scheme, and keeps every
         concept at the IRI that TORDF gives it. Terms and glosses are carried over with
         only their whitespace collapsed. A TORDF stylesheet is kept as inline XML, where
         document() has no project folder to resolve against, so the derived groupings are
         written out here and test/skos.test.mjs compares them with their sources. -->
    <xsl:variable name="taxonomy" select="/t:TEI/t:teiHeader/t:encodingDesc/t:classDecl/t:taxonomy[@xml:id = 'Urfehdekodierung']"/>

    <!-- The sanction groups of ufbas-context.xsl ($sanctionGroups). -->
    <xsl:variable name="collections" as="element()*">
        <d:group key="sanktion" label="Sanktionen" members="StrafeAusweisung StrafeGeldstrafe StrafeKörperstrafe StrafeGefängnis StrafeAmtsentlassung StrafeHausarrest StrafeVerbotWirtshaus StrafeVerbotWaffen StrafeVerbotSpiel StrafeVerbotTanz StrafeVerbot"/>
        <d:group key="modalitaet" label="Modalitäten" members="StrafeStrafandrohung StrafeErmahnung StrafeAusnahme StrafeMilderung StrafeStrafumwandlung"/>
        <d:group key="verfahren" label="Verfahrensausgang" members="StrafeUrteilohneStrafe StrafeWeisungananderesGericht"/>
        <d:group key="pflicht" label="Pflichten und Wiedergutmachung" members="StrafeEntschuldigung StrafeWiedergutmachung StrafeEntschädigungRückzahlung"/>
    </xsl:variable>

    <!-- The colour classes of the Exploration view (CLASSES in js/exploration.js). The
         view gives an entry the class "ohne" when none of its Strafe categories is in
         another class, so as a set of categories "ohne" holds the remaining Strafe
         concepts, computed below. -->
    <xsl:variable name="classes" as="element()*">
        <d:class key="ausweisung" label="Ausweisung" members="StrafeAusweisung"/>
        <d:class key="haft" label="Haft, Körperstrafe, Amtsentlassung" short="Haft, Körper, Amt" members="StrafeGefängnis StrafeKörperstrafe StrafeAmtsentlassung"/>
        <d:class key="geld" label="Geldstrafe" members="StrafeGeldstrafe"/>
        <d:class key="verbot" label="Verbote und Hausarrest" short="Verbote" members="StrafeVerbotWirtshaus StrafeVerbotWaffen StrafeVerbotSpiel StrafeVerbotTanz StrafeVerbot StrafeHausarrest"/>
        <d:class key="ohne" label="ohne Sanktion, nur Ermahnung, Drohung oder anderer Ausgang" short="ohne Sanktion" members=""/>
    </xsl:variable>

    <!-- Categories that the ontology models as a value, property or class since 2026.
         They stay concepts, since links and the published RDF point to them. -->
    <xsl:variable name="modelled" as="element()*">
        <d:match id="male" relation="exactMatch" term="male" kind="Wert"/>
        <d:match id="female" relation="exactMatch" term="female" kind="Wert"/>
        <d:match id="Beruf" relation="closeMatch" term="occupation" kind="Eigenschaft"/>
        <d:match id="Status" relation="closeMatch" term="status" kind="Eigenschaft"/>
        <d:match id="Zivilstand" relation="closeMatch" term="civilStatus" kind="Eigenschaft"/>
        <d:match id="Beiname" relation="closeMatch" term="byname" kind="Eigenschaft"/>
        <d:match id="Verwandtschaftsgrad" relation="closeMatch" term="kinship" kind="Eigenschaft"/>
        <d:match id="Eingangsnotiz" relation="closeMatch" term="MarginalNote" kind="Klasse"/>
    </xsl:variable>

    <xsl:template name="concept-scheme">
        <rdf:RDF>
            <skos:ConceptScheme rdf:about="{$kat}Urfehdekodierung">
                <skos:prefLabel xml:lang="de">Urfehdekodierung</skos:prefLabel>
                <xsl:for-each select="$taxonomy/t:category">
                    <skos:hasTopConcept rdf:resource="{d:concept(.)}"/>
                </xsl:for-each>
            </skos:ConceptScheme>
            <xsl:apply-templates select="$taxonomy//t:category" mode="concept"/>
            <xsl:for-each select="$collections">
                <skos:Collection rdf:about="{$kat}collection-{@key}">
                    <skos:prefLabel xml:lang="de"><xsl:value-of select="@label"/></skos:prefLabel>
                    <xsl:for-each select="tokenize(@members, ' ')">
                        <skos:member rdf:resource="{$kat}{.}"/>
                    </xsl:for-each>
                </skos:Collection>
            </xsl:for-each>
            <xsl:variable name="classified" select="tokenize(string-join($classes/@members, ' '), ' ')"/>
            <xsl:for-each select="$classes">
                <skos:Collection rdf:about="{$kat}klasse-{@key}">
                    <skos:prefLabel xml:lang="de"><xsl:value-of select="@label"/></skos:prefLabel>
                    <xsl:if test="@short">
                        <skos:altLabel xml:lang="de"><xsl:value-of select="@short"/></skos:altLabel>
                    </xsl:if>
                    <xsl:variable name="members" select="if (@key = 'ohne')
                        then $taxonomy//t:category[@xml:id = 'uf_Strafe']//t:category/d:category-id(.)[not(. = $classified)]
                        else tokenize(@members, ' ')"/>
                    <xsl:for-each select="$members">
                        <skos:member rdf:resource="{$kat}{.}"/>
                    </xsl:for-each>
                </skos:Collection>
            </xsl:for-each>
        </rdf:RDF>
    </xsl:template>

    <xsl:template match="t:category" mode="concept">
        <xsl:variable name="id" select="d:category-id(.)"/>
        <xsl:variable name="term" select="normalize-space(t:catDesc/t:term)"/>
        <xsl:variable name="gloss" select="normalize-space(t:catDesc/t:gloss)"/>
        <xsl:variable name="match" select="$modelled[@id = $id]"/>
        <!-- A parenthesis of the gloss that tells the annotators what to code elsewhere, by
             naming another category or a Tatbestand, is a coding rule and becomes the scope
             note, the rest the definition. Nine glosses carry one (knowledge/domain.md). -->
        <xsl:variable name="split">
            <xsl:analyze-string select="$gloss" regex="\s*\(([^()]*)\)">
                <xsl:matching-substring>
                    <xsl:choose>
                        <xsl:when test="matches(regex-group(1), 'kat[a-zäöü]*gor|tatbestand', 'i')">
                            <d:rule>
                                <xsl:value-of select="regex-group(1)"/>
                            </d:rule>
                        </xsl:when>
                        <xsl:otherwise>
                            <xsl:value-of select="."/>
                        </xsl:otherwise>
                    </xsl:choose>
                </xsl:matching-substring>
                <xsl:non-matching-substring>
                    <xsl:value-of select="."/>
                </xsl:non-matching-substring>
            </xsl:analyze-string>
        </xsl:variable>
        <xsl:variable name="definition" select="normalize-space(string-join($split/text(), ''))"/>
        <skos:Concept rdf:about="{d:concept(.)}">
            <skos:inScheme rdf:resource="{$kat}Urfehdekodierung"/>
            <!-- Eintrag and Eingangsnotiz have no catDesc. Their id is the German label that
                 o:ufbas.schema already gives them as rdfs:label, so it is no invented value. -->
            <skos:prefLabel xml:lang="de"><xsl:value-of select="if ($term != '') then $term else $id"/></skos:prefLabel>
            <xsl:if test="$definition != '' and $gloss != $term">
                <skos:definition xml:lang="de"><xsl:value-of select="$definition"/></skos:definition>
            </xsl:if>
            <xsl:for-each select="$split/d:rule">
                <skos:scopeNote xml:lang="de"><xsl:value-of select="normalize-space(.)"/></skos:scopeNote>
            </xsl:for-each>
            <xsl:choose>
                <xsl:when test="parent::t:taxonomy">
                    <skos:topConceptOf rdf:resource="{$kat}Urfehdekodierung"/>
                </xsl:when>
                <xsl:otherwise>
                    <skos:broader rdf:resource="{d:concept(parent::t:category)}"/>
                </xsl:otherwise>
            </xsl:choose>
            <xsl:for-each select="t:category">
                <skos:narrower rdf:resource="{d:concept(.)}"/>
            </xsl:for-each>
            <xsl:if test="$match">
                <xsl:element name="skos:{$match/@relation}">
                    <xsl:attribute name="rdf:resource" select="concat($ont, $match/@term)"/>
                </xsl:element>
                <skos:historyNote xml:lang="de">
                    <xsl:value-of select="concat('Seit 2026 in der Ontologie als ', $match/@kind, ' ufbas-ont:', $match/@term, ' modelliert.')"/>
                </skos:historyNote>
            </xsl:if>
        </skos:Concept>
    </xsl:template>

    <!-- TORDF expands the prefix uf_ to the project namespace. Every category of the
         taxonomy carries it; another prefix would give a concept outside the scheme's
         IRI space, so it stops the run instead. -->
    <xsl:function name="d:category-id" as="xs:string">
        <xsl:param name="category" as="element()"/>
        <xsl:if test="not(starts-with($category/@xml:id, 'uf_'))">
            <xsl:message terminate="yes">Category <xsl:value-of select="$category/@xml:id"/> without the prefix uf_.</xsl:message>
        </xsl:if>
        <xsl:sequence select="substring-after($category/@xml:id, 'uf_')"/>
    </xsl:function>

    <xsl:function name="d:concept" as="xs:string">
        <xsl:param name="category" as="element()"/>
        <xsl:sequence select="concat($kat, d:category-id($category))"/>
    </xsl:function>

    <!-- entry, proceeding and everything derived inside the entry -->

    <xsl:template match="t:div" mode="entry">
        <xsl:variable name="entry" select="."/>
        <xsl:variable name="proceeding" select="d:proceeding(.)"/>
        <!-- every page the entry occupies, the one it starts on and each break inside; the
             spans look their pages up here, since counting the folio per span doubles the
             run time -->
        <xsl:variable name="pages" select="(preceding::t:pb[1], .//t:pb)"/>
        <xsl:variable name="page-iris" select="for $pb in $pages return d:page($pb)"/>
        <rdf:Description rdf:about="{$data}{@xml:id}">
            <rdf:type rdf:resource="{$ont}Entry"/>
            <xsl:call-template name="text"/>
            <gams:isPartOf rdf:resource="{$volume}"/>
            <!-- the page it starts on; its spans name the pages it continues on -->
            <ufbas-ont:onPage rdf:resource="{$page-iris[1]}"/>
            <ufbas-ont:entryType rdf:resource="{$ont}{$entry-index[@id = current()/@xml:id]/@type}"/>
            <ufbas-ont:documents rdf:resource="{$proceeding}"/>
            <xsl:for-each select="$hosts[@id = current()/@xml:id]">
                <ufbas-ont:continues rdf:resource="{$data}{@host}"/>
            </xsl:for-each>
            <xsl:for-each select="distinct-values($xrefs[self::d:x][@src = current()/@xml:id][@kind = ('statement', 'continuation')]/@target[. != ''])">
                <ufbas-ont:relatedEntry rdf:resource="{$data}{.}"/>
            </xsl:for-each>
            <!-- every place of the place list the entry names, whatever its role, so a place
                 name finds all its spellings -->
            <xsl:for-each select="distinct-values(.//t:placeName[@ref][d:entry(.) is $entry]/d:ref(.))">
                <ufbas-ont:mentionsPlace rdf:resource="{.}"/>
            </xsl:for-each>
        </rdf:Description>
        <!-- A proceeding has no element of its own, the entry that documents it is its evidence. -->
        <rdf:Description rdf:about="{$proceeding}">
            <rdf:type rdf:resource="{$ont}UrfehdeProceeding"/>
            <ufbas-ont:derivedFrom rdf:resource="{$data}{@xml:id}"/>
        </rdf:Description>
        <xsl:apply-templates select="d:spans(.)" mode="span">
            <xsl:with-param name="pages" select="$pages" tunnel="yes"/>
            <xsl:with-param name="page-iris" select="$page-iris" tunnel="yes"/>
        </xsl:apply-templates>
        <xsl:apply-templates select=".//t:note[tokenize(@ana, '\s+') = '#uf_Eingangsnotiz'][d:entry(.) is $entry]" mode="marginal-note"/>
        <xsl:apply-templates select=".//t:measure[@type = 'currency'][d:entry(.) is $entry]" mode="amount"/>
        <xsl:apply-templates select=".//t:date[@dur][not(@ana)][d:entry(.) is $entry]" mode="duration"/>
    </xsl:template>

    <xsl:template match="*" mode="span">
        <xsl:param name="pages" as="element()*" tunnel="yes"/>
        <xsl:param name="page-iris" as="xs:string*" tunnel="yes"/>
        <xsl:variable name="e" select="."/>
        <xsl:variable name="cats" select="d:cats(.)"/>
        <rdf:Description rdf:about="{d:iri('', .)}">
            <rdf:type rdf:resource="{$ont}Span"/>
            <xsl:call-template name="text"/>
            <gams:isPartOf rdf:resource="{$data}{d:entry(.)/@xml:id}"/>
            <!-- the page the span starts on and each page break inside it -->
            <xsl:variable name="start" select="max(for $i in 1 to count($pages) return $i[$pages[$i] &lt;&lt; $e])"/>
            <xsl:for-each select="for $i in 1 to count($pages) return $i[$i = $start or exists($pages[$i]/ancestor::* intersect $e)]">
                <ufbas-ont:onPage rdf:resource="{$page-iris[current()]}"/>
            </xsl:for-each>
            <xsl:call-template name="categories">
                <xsl:with-param name="cats" select="$cats"/>
            </xsl:call-template>
        </rdf:Description>

        <xsl:for-each select="$kinds">
            <xsl:call-template name="parts">
                <xsl:with-param name="span" select="$e"/>
                <xsl:with-param name="kind" select="."/>
            </xsl:call-template>
        </xsl:for-each>
        <xsl:if test="$cats = 'DatumBegnadigung'">
            <rdf:Description rdf:about="{d:iri('pardon-', .)}">
                <rdf:type rdf:resource="{$ont}Pardon"/>
                <ufbas-ont:hasTimeSpan rdf:resource="{d:iri('time-', .)}"/>
                <ufbas-ont:derivedFrom rdf:resource="{d:iri('', .)}"/>
            </rdf:Description>
            <rdf:Description rdf:about="{d:proceeding(d:entry(.))}">
                <ufbas-ont:hasPart rdf:resource="{d:iri('pardon-', .)}"/>
            </rdf:Description>
        </xsl:if>

        <xsl:if test="exists($cats[starts-with(., 'Datum')])">
            <xsl:call-template name="time-span"/>
        </xsl:if>
        <xsl:if test="$cats = 'DatumUrfehde'">
            <xsl:for-each select="d:targets(., $kinds[@prefix = 'oath'])">
                <rdf:Description rdf:about="{.}">
                    <ufbas-ont:hasTimeSpan rdf:resource="{d:iri('time-', $e)}"/>
                </rdf:Description>
            </xsl:for-each>
        </xsl:if>
        <xsl:if test="$cats = 'DatumTat'">
            <xsl:for-each select="d:targets(., $kinds[@prefix = 'offence'])">
                <rdf:Description rdf:about="{.}">
                    <ufbas-ont:hasTimeSpan rdf:resource="{d:iri('time-', $e)}"/>
                </rdf:Description>
            </xsl:for-each>
        </xsl:if>
        <!-- a deadline outside a sanction has no owner in the model and stays on its span -->
        <xsl:if test="$cats = 'DatumFrist'">
            <xsl:for-each select="d:nodes(ancestor::*[d:is-span(.)][exists(d:cats(.)[starts-with(., 'Strafe')])][1], $kinds[@prefix = 'sanction'])">
                <rdf:Description rdf:about="{.}">
                    <ufbas-ont:deadline rdf:resource="{d:iri('time-', $e)}"/>
                </rdf:Description>
            </xsl:for-each>
        </xsl:if>

        <xsl:if test="d:is-person(.)">
            <xsl:call-template name="person"/>
        </xsl:if>
        <!-- person attributes as written, on the person the element belongs to; the TEI has
             empty annotated elements, which give no literal -->
        <xsl:variable name="person" select="if (d:is-person(.)) then . else d:person-of(.)"/>
        <xsl:if test="$person and d:label(.) != ''">
            <xsl:for-each select="$attributes[@cat = $cats]">
                <rdf:Description rdf:about="{d:iri('person-', $person)}">
                    <xsl:element name="ufbas-ont:{@property}" namespace="{$ont}">
                        <xsl:value-of select="d:label($e)"/>
                    </xsl:element>
                </rdf:Description>
            </xsl:for-each>
        </xsl:if>

        <!-- places: the shared node of the place list where @ref names one, else a place of
             this mention with the text as written -->
        <xsl:if test="exists($cats[starts-with(., 'Ort')])">
            <xsl:variable name="place" select="if (@ref) then d:ref(.) else d:iri('place-', .)"/>
            <xsl:if test="not(@ref)">
                <rdf:Description rdf:about="{$place}">
                    <rdf:type rdf:resource="{$ont}Place"/>
                    <xsl:if test="d:label(.) != ''">
                        <ufbas-ont:placeAsWritten>
                            <xsl:value-of select="d:label(.)"/>
                        </ufbas-ont:placeAsWritten>
                    </xsl:if>
                    <ufbas-ont:derivedFrom rdf:resource="{d:iri('', .)}"/>
                </rdf:Description>
            </xsl:if>
            <xsl:if test="$cats = 'OrtTatort'">
                <xsl:for-each select="d:targets(., $kinds[@prefix = 'offence'])">
                    <rdf:Description rdf:about="{.}">
                        <ufbas-ont:tookPlaceAt rdf:resource="{$place}"/>
                    </rdf:Description>
                </xsl:for-each>
            </xsl:if>
            <!-- an origin or residence outside any person has no owner and stays on its span -->
            <xsl:if test="$person">
                <xsl:if test="$cats = 'OrtHerkunft'">
                    <rdf:Description rdf:about="{d:iri('person-', $person)}">
                        <ufbas-ont:origin rdf:resource="{$place}"/>
                    </rdf:Description>
                </xsl:if>
                <xsl:if test="$cats = 'OrtWohnort'">
                    <rdf:Description rdf:about="{d:iri('person-', $person)}">
                        <ufbas-ont:residence rdf:resource="{$place}"/>
                    </rdf:Description>
                </xsl:if>
            </xsl:if>
        </xsl:if>
    </xsl:template>

    <!-- the parts of one kind a span gives, one per category, linked from the proceeding -->
    <xsl:template name="parts">
        <xsl:param name="span" as="element()"/>
        <xsl:param name="kind" as="element()"/>
        <xsl:variable name="cats" select="d:kind-cats($span, $kind)"/>
        <xsl:variable name="nodes" select="d:nodes($span, $kind)"/>
        <xsl:variable name="offender" select="if (exists($nodes)) then d:single-offender(d:entry($span)) else ()"/>
        <xsl:for-each select="$nodes">
            <xsl:variable name="i" select="position()"/>
            <rdf:Description rdf:about="{.}">
                <rdf:type rdf:resource="{$ont}{$kind/@class}"/>
                <ufbas-ont:category rdf:resource="{$kat}{$cats[$i]}"/>
                <xsl:if test="$offender and $kind/@class = 'Offence'">
                    <ufbas-ont:committedBy rdf:resource="{d:iri('person-', $offender)}"/>
                </xsl:if>
                <xsl:if test="$offender and $kind/@class = 'Sanction'">
                    <ufbas-ont:appliesTo rdf:resource="{d:iri('person-', $offender)}"/>
                </xsl:if>
                <ufbas-ont:derivedFrom rdf:resource="{d:iri('', $span)}"/>
            </rdf:Description>
            <rdf:Description rdf:about="{d:proceeding(d:entry($span))}">
                <ufbas-ont:hasPart rdf:resource="{.}"/>
            </rdf:Description>
        </xsl:for-each>
    </xsl:template>

    <!-- The date as the TEI codes it, from the span or the unannotated date inside it. It is
         a string, since an xsd:date would assume the Gregorian calendar. -->
    <xsl:template name="time-span">
        <xsl:variable name="span" select="."/>
        <xsl:variable name="sources" select="(., .//t:date[not(@ana)][d:span-of(.) is $span])"/>
        <rdf:Description rdf:about="{d:iri('time-', .)}">
            <rdf:type rdf:resource="{$ont}TimeSpan"/>
            <xsl:call-template name="categories">
                <xsl:with-param name="cats" select="d:cats(.)[starts-with(., 'Datum')]"/>
            </xsl:call-template>
            <xsl:for-each select="distinct-values($sources/@when/normalize-space())">
                <ufbas-ont:dateAsCoded>
                    <xsl:value-of select="."/>
                </ufbas-ont:dateAsCoded>
            </xsl:for-each>
            <xsl:if test="$sources/@calendar = 'Julian'">
                <ufbas-ont:calendar rdf:resource="{$ont}julian"/>
            </xsl:if>
            <xsl:for-each select="distinct-values($sources/@dur/normalize-space())">
                <ufbas-ont:duration rdf:datatype="{$xsd}duration">
                    <xsl:value-of select="."/>
                </ufbas-ont:duration>
            </xsl:for-each>
            <!-- a contradiction of the coded date stands beside it, the date stays (ADR-06) -->
            <xsl:variable name="conflicts" select="d:date-conflicts(.)"/>
            <xsl:for-each select="$conflicts">
                <ufbas-ont:dateConflict rdf:resource="{$ont}{@kind}"/>
            </xsl:for-each>
            <xsl:for-each select="distinct-values($conflicts/@suggested[. != ''])">
                <ufbas-ont:dateSuggested>
                    <xsl:value-of select="."/>
                </ufbas-ont:dateSuggested>
            </xsl:for-each>
            <ufbas-ont:derivedFrom rdf:resource="{d:iri('', .)}"/>
        </rdf:Description>
    </xsl:template>

    <xsl:template name="person">
        <xsl:variable name="person" select="."/>
        <xsl:variable name="cats" select="d:cats(.)"/>
        <xsl:variable name="forenames" select=".//t:forename[d:person-of(.) is $person]"/>
        <!-- The gender token on the person, else those of its own forenames. A forename of
             another person inside the name gives none, and the token on the person wins over
             the forename of a father or husband it is named after. -->
        <xsl:variable name="own" select="tokenize(@ana, '\s+')[. = ('#uf_male', '#uf_female')]"/>
        <xsl:variable name="gender" select="if (exists($own)) then $own else (for $f in $forenames return tokenize($f/@ana, '\s+'))"/>
        <rdf:Description rdf:about="{d:iri('person-', .)}">
            <rdf:type rdf:resource="{$ont}PersonMention"/>
            <xsl:call-template name="categories">
                <xsl:with-param name="cats" select="$cats[starts-with(., 'Person') or starts-with(., 'Schlagwort')]"/>
            </xsl:call-template>
            <xsl:if test="d:label(.) != ''">
                <ufbas-ont:nameAsWritten>
                    <xsl:value-of select="d:label(.)"/>
                </ufbas-ont:nameAsWritten>
            </xsl:if>
            <xsl:for-each select="$forenames[d:label(.) != '']">
                <ufbas-ont:forename>
                    <xsl:value-of select="d:label(.)"/>
                </ufbas-ont:forename>
            </xsl:for-each>
            <xsl:for-each select=".//t:surname[d:person-of(.) is $person][d:label(.) != '']">
                <ufbas-ont:surname>
                    <xsl:value-of select="d:label(.)"/>
                </ufbas-ont:surname>
            </xsl:for-each>
            <xsl:if test="$gender = '#uf_male'">
                <ufbas-ont:gender rdf:resource="{$ont}male"/>
            </xsl:if>
            <xsl:if test="$gender = '#uf_female'">
                <ufbas-ont:gender rdf:resource="{$ont}female"/>
            </xsl:if>
            <ufbas-ont:derivedFrom rdf:resource="{d:iri('', .)}"/>
        </rdf:Description>
        <xsl:if test="$roles[@cat = $cats]">
            <rdf:Description rdf:about="{d:proceeding(d:entry(.))}">
                <xsl:for-each select="$roles[@cat = $cats]">
                    <xsl:element name="ufbas-ont:{@property}" namespace="{$ont}">
                        <xsl:attribute name="rdf:resource" select="d:iri('person-', $person)"/>
                    </xsl:element>
                </xsl:for-each>
            </rdf:Description>
        </xsl:if>
    </xsl:template>

    <!-- One claim per annotated element in the note, with the first num after it and before
         the next one. A note without such an element is one claim. The element names the
         guard, as a person, or the tower, as a place. Names stay as written. -->
    <xsl:template match="t:note" mode="marginal-note">
        <xsl:variable name="note" select="."/>
        <xsl:variable name="starts" select=".//*[@ana][@xml:id]"/>
        <xsl:for-each select="if (exists($starts)) then $starts else .">
            <xsl:variable name="start" select="."/>
            <xsl:variable name="next" select="$starts[. >> $start][1]"/>
            <xsl:variable name="num" select="($note//t:num[. >> $start or $start is $note][not($next) or . &lt;&lt; $next])[1]"/>
            <xsl:variable name="claim" select="d:iri('marginalnote-', .)"/>
            <rdf:Description rdf:about="{$claim}">
                <rdf:type rdf:resource="{$ont}MarginalNote"/>
                <xsl:choose>
                    <xsl:when test=". is $note"/>
                    <xsl:when test="d:is-person(.)">
                        <ufbas-ont:claimant rdf:resource="{d:iri('person-', .)}"/>
                    </xsl:when>
                    <xsl:when test="@ref">
                        <ufbas-ont:tookPlaceAt rdf:resource="{d:ref(.)}"/>
                    </xsl:when>
                    <xsl:when test="d:label(.) != ''">
                        <ufbas-ont:placeAsWritten>
                            <xsl:value-of select="d:label(.)"/>
                        </ufbas-ont:placeAsWritten>
                    </xsl:when>
                </xsl:choose>
                <xsl:if test="matches(normalize-space($num), '^[0-9]+$')">
                    <ufbas-ont:releasedCount rdf:datatype="{$xsd}nonNegativeInteger">
                        <xsl:value-of select="normalize-space($num)"/>
                    </ufbas-ont:releasedCount>
                </xsl:if>
                <ufbas-ont:derivedFrom rdf:resource="{d:iri('', $note)}"/>
            </rdf:Description>
            <rdf:Description rdf:about="{$data}{d:entry($note)/@xml:id}">
                <ufbas-ont:hasMarginalNote rdf:resource="{$claim}"/>
            </rdf:Description>
        </xsl:for-each>
    </xsl:template>

    <!-- An amount is named after its span, or its entry outside any span, and its position
         among the amounts named after the same element. -->
    <xsl:template match="t:measure" mode="amount">
        <xsl:variable name="measure" select="."/>
        <xsl:variable name="span" select="d:span-of(.)"/>
        <xsl:variable name="owner" select="($span, d:entry(.))[1]"/>
        <xsl:variable name="position" select="count($owner//t:measure[@type = 'currency'][. &lt;&lt; $measure][(d:span-of(.), d:entry(.))[1] is $owner]) + 1"/>
        <xsl:variable name="amount" select="concat($data, 'amount-', $owner/@xml:id, '-', $position)"/>
        <rdf:Description rdf:about="{$amount}">
            <rdf:type rdf:resource="{$ont}MonetaryAmount"/>
            <xsl:if test="@quantity castable as xs:decimal">
                <ufbas-ont:quantity rdf:datatype="{$xsd}decimal">
                    <xsl:value-of select="normalize-space(@quantity)"/>
                </ufbas-ont:quantity>
            </xsl:if>
            <xsl:if test="normalize-space(@unit)">
                <ufbas-ont:unitAsWritten rdf:resource="{$ont}unit-{normalize-space(@unit)}"/>
            </xsl:if>
            <!-- outside any span the entry, which is a gams:Text as a span is, is the evidence -->
            <ufbas-ont:derivedFrom rdf:resource="{d:iri('', $owner)}"/>
        </rdf:Description>
        <xsl:variable name="context" select="ancestor::*[d:is-span(.)][exists(d:cats(.)[starts-with(., 'Tat') or starts-with(., 'Strafe')])][1]"/>
        <xsl:for-each select="if ($context) then (d:nodes($context, $kinds[@prefix = 'offence']), d:nodes($context, $kinds[@prefix = 'sanction']))
            else if (not($span)) then d:proceeding(d:entry(.)) else ()">
            <rdf:Description rdf:about="{.}">
                <ufbas-ont:concerns rdf:resource="{$amount}"/>
            </rdf:Description>
        </xsl:for-each>
    </xsl:template>

    <!-- An unannotated duration inside a date span is part of that span's time-span. Inside a
         detention or sanction it becomes the duration of that part. Elsewhere it has no owner
         in the model and is left out. -->
    <xsl:template match="t:date" mode="duration">
        <xsl:variable name="date" select="."/>
        <xsl:variable name="owner" select="d:duration-owner(.)"/>
        <xsl:if test="$owner">
            <xsl:variable name="position" select="count($owner//t:date[@dur][not(@ana)][. &lt;&lt; $date][d:duration-owner(.) is $owner]) + 1"/>
            <xsl:variable name="time" select="concat($data, 'time-', $owner/@xml:id, '-', $position)"/>
            <rdf:Description rdf:about="{$time}">
                <rdf:type rdf:resource="{$ont}TimeSpan"/>
                <ufbas-ont:duration rdf:datatype="{$xsd}duration">
                    <xsl:value-of select="normalize-space(@dur)"/>
                </ufbas-ont:duration>
                <ufbas-ont:derivedFrom rdf:resource="{d:iri('', $owner)}"/>
            </rdf:Description>
            <xsl:for-each select="(d:nodes($owner, $kinds[@prefix = 'detention']), d:nodes($owner, $kinds[@prefix = 'sanction']))">
                <rdf:Description rdf:about="{.}">
                    <ufbas-ont:hasTimeSpan rdf:resource="{$time}"/>
                </rdf:Description>
            </xsl:for-each>
        </xsl:if>
    </xsl:template>

    <xsl:template match="t:pb" mode="page">
        <xsl:variable name="image" select="substring-after(normalize-space(@facs), '#')"/>
        <rdf:Description rdf:about="{d:page(.)}">
            <rdf:type rdf:resource="{$ont}Page"/>
            <ufbas-ont:folio>
                <xsl:value-of select="d:folio(.)"/>
            </ufbas-ont:folio>
            <xsl:if test="$image castable as xs:integer">
                <ufbas-ont:imageNumber rdf:datatype="{$xsd}integer">
                    <xsl:value-of select="$image"/>
                </ufbas-ont:imageNumber>
            </xsl:if>
            <gams:isPartOf rdf:resource="{$volume}"/>
        </rdf:Description>
    </xsl:template>

    <!-- shared output -->

    <!-- the reading text of an entry or span, which the full-text search reads and in which
         the search page marks the annotated text of a span -->
    <xsl:template name="text">
        <xsl:variable name="text" select="d:reading-text(.)"/>
        <xsl:if test="$text != ''">
            <gams:textualContent>
                <xsl:value-of select="$text"/>
            </gams:textualContent>
        </xsl:if>
    </xsl:template>

    <xsl:template name="categories">
        <xsl:param name="cats" as="xs:string*"/>
        <xsl:for-each select="distinct-values($cats)">
            <ufbas-ont:category rdf:resource="{$kat}{.}"/>
        </xsl:for-each>
    </xsl:template>

    <!-- classification -->

    <!-- An annotated element with an id inside an entry. A persName without @ana is one too,
         because it names a person that its forenames and attributes belong to. -->
    <xsl:function name="d:is-span" as="xs:boolean">
        <xsl:param name="e" as="element()"/>
        <xsl:sequence select="exists($e/@xml:id) and (exists($e/@ana) or exists($e/self::t:persName))
            and not($e/@ana = '#uf_Eintrag' and $e/self::t:div) and exists(d:entry($e))"/>
    </xsl:function>

    <!-- The categories of @ana, the id without "#uf_". Left out are the gender tokens, a
         person attribute, the structural Eintrag and Eingangsnotiz, which become the entry and
         the marginal note, and stray values without the "#uf_" prefix. -->
    <xsl:function name="d:cats" as="xs:string*">
        <xsl:param name="e" as="element()?"/>
        <!-- an upper-case initial without a regular expression, which SaxonJS compiles anew
             on every call and which made this function take most of the run time -->
        <xsl:sequence select="distinct-values(for $t in tokenize(normalize-space($e/@ana), ' ')[starts-with(., '#uf_') and substring(., 5, 1) != lower-case(substring(., 5, 1))]
            return substring($t, 5)[not(. = ('Eintrag', 'Eingangsnotiz'))])"/>
    </xsl:function>

    <xsl:function name="d:kind-cats" as="xs:string*">
        <xsl:param name="e" as="element()?"/>
        <xsl:param name="kind" as="element()"/>
        <xsl:sequence select="d:cats($e)[if ($kind/@starts) then starts-with(., $kind/@starts) else . = tokenize($kind/@cats, ' ')]"/>
    </xsl:function>

    <!-- the IRIs of the parts of one kind derived from a span, in the order of its @ana -->
    <xsl:function name="d:nodes" as="xs:string*">
        <xsl:param name="e" as="element()?"/>
        <xsl:param name="kind" as="element()"/>
        <xsl:variable name="cats" select="d:kind-cats($e, $kind)"/>
        <xsl:sequence select="for $i in 1 to count($cats)
            return concat($data, $kind/@prefix, '-', $e/@xml:id, if ($i = 1) then '' else concat('-', $cats[$i]))"/>
    </xsl:function>

    <xsl:function name="d:is-person" as="xs:boolean">
        <xsl:param name="e" as="element()"/>
        <xsl:sequence select="d:is-span($e) and (exists($e/self::t:persName) or exists(d:cats($e)[starts-with(., 'Person')])
            or (d:cats($e) = $guards and exists($e/ancestor::t:note[tokenize(@ana, '\s+') = '#uf_Eingangsnotiz'])))"/>
    </xsl:function>

    <xsl:function name="d:entry" as="element()?">
        <xsl:param name="n" as="node()"/>
        <xsl:sequence select="$n/ancestor::t:div[@ana = '#uf_Eintrag'][1]"/>
    </xsl:function>

    <xsl:function name="d:spans" as="element()*">
        <xsl:param name="entry" as="element()"/>
        <xsl:sequence select="key('spans', generate-id($entry), root($entry))"/>
    </xsl:function>

    <xsl:function name="d:span-of" as="element()?">
        <xsl:param name="n" as="node()"/>
        <xsl:sequence select="$n/ancestor::*[d:is-span(.)][1]"/>
    </xsl:function>

    <xsl:function name="d:person-of" as="element()?">
        <xsl:param name="n" as="node()"/>
        <xsl:sequence select="$n/ancestor::*[d:is-person(.)][1]"/>
    </xsl:function>

    <!-- The offender of an entry that names exactly one: one span coded Täter and none coded
         Mittäter. An entry with several offenders or accomplices gives no offence an agent,
         since the TEI annotates offences per entry, not per person. -->
    <xsl:function name="d:single-offender" as="element()?">
        <xsl:param name="entry" as="element()"/>
        <xsl:variable name="spans" select="d:spans($entry)"/>
        <xsl:variable name="offenders" select="$spans[d:cats(.) = 'PersonTäter']"/>
        <xsl:sequence select="if (count($offenders) = 1 and empty($spans[d:cats(.) = 'PersonMittäter'])) then $offenders else ()"/>
    </xsl:function>

    <!-- What a place or date of deed, or an Urfehde date, belongs to: the parts of the kind
         derived from the enclosing span of that kind, else the single part of the kind in the
         entry, else the proceeding. -->
    <xsl:function name="d:targets" as="xs:string+">
        <xsl:param name="e" as="element()"/>
        <xsl:param name="kind" as="element()"/>
        <xsl:variable name="entry" select="d:entry($e)"/>
        <xsl:variable name="enclosing" select="$e/ancestor-or-self::*[d:is-span(.)][exists(d:kind-cats(., $kind))][1]"/>
        <xsl:variable name="all" select="for $s in d:spans($entry) return d:nodes($s, $kind)"/>
        <xsl:sequence select="if ($enclosing) then d:nodes($enclosing, $kind)
            else if (count($all) = 1) then $all
            else d:proceeding($entry)"/>
    </xsl:function>

    <!-- The detention or sanction an unannotated duration belongs to, none where a date
         span encloses it, since that span's time-span carries it. -->
    <xsl:function name="d:duration-owner" as="element()?">
        <xsl:param name="date" as="element()"/>
        <xsl:sequence select="if (exists(d:cats(d:span-of($date))[starts-with(., 'Datum')])) then ()
            else $date/ancestor::*[d:is-span(.)][exists(d:cats(.)[. = 'Untersuchungshaft' or starts-with(., 'Strafe')])][1]"/>
    </xsl:function>

    <!-- IRIs -->

    <xsl:function name="d:iri" as="xs:string">
        <xsl:param name="prefix" as="xs:string"/>
        <xsl:param name="e" as="element()"/>
        <xsl:sequence select="concat($data, $prefix, $e/@xml:id)"/>
    </xsl:function>

    <!-- named after its entry, or after the host entry of a fragment -->
    <xsl:function name="d:proceeding" as="xs:string">
        <xsl:param name="entry" as="element()"/>
        <xsl:variable name="host" select="$hosts[@id = $entry/@xml:id]/@host"/>
        <xsl:sequence select="concat($data, 'proceeding-', if ($host) then $host else $entry/@xml:id)"/>
    </xsl:function>

    <!-- the place IRI of the RDF of 2017, relative to the object; one published @ref reads
         " #Liestal", which the space-normalised form resolves to the listed place -->
    <xsl:function name="d:ref" as="xs:string">
        <xsl:param name="e" as="element()"/>
        <xsl:variable name="ref" select="normalize-space($e/@ref)"/>
        <xsl:sequence select="if (starts-with($ref, '#')) then concat($data, substring($ref, 2)) else $ref"/>
    </xsl:function>

    <!-- A page is named after its folio. The two unfoliated pages share the folio
         "unfoliiert" and are told apart by their image number. -->
    <xsl:function name="d:page" as="xs:string">
        <xsl:param name="pb" as="element()"/>
        <xsl:sequence select="concat($data, 'page-', d:folio($pb),
            if ($pb/@n = 'kA') then concat('-', substring-after(normalize-space($pb/@facs), '#')) else '')"/>
    </xsl:function>

    <!-- as uf:folio of ufbas-object.xsl, without the "fol. " prefix -->
    <xsl:function name="d:folio" as="xs:string">
        <xsl:param name="pb" as="element()"/>
        <xsl:variable name="page" select="count($counted-pages[. &lt;&lt; $pb]) + 1"/>
        <xsl:sequence select="
            if ($pb/@n = 'kA') then 'unfoliiert'
            else if ($pb/@n) then string($pb/@n)
            else concat(($page + 1) idiv 2, if ($page mod 2 = 1) then 'r' else 'v')"/>
    </xsl:function>

    <!-- entry type -->

    <!-- The type of an entry after the introduction of the edition, by five rules on the
         editors' notes, the wording and the inserted leaf 32a, the first that applies
         deciding. They reproduce research-artefacts/entry-types.tsv. A fragment either
         carries the editors' note "Fortsetzung des Eintrags" or is a notarial closing
         without heading and date. A written oath is headed "verschribne urphet" or speaks
         in the first person. A statement carries the editors' note or reports without
         date, oath, subscription or sanction. -->
    <xsl:function name="d:entry-type" as="xs:string">
        <xsl:param name="entry" as="element()"/>
        <xsl:param name="full" as="xs:string"/>
        <xsl:variable name="notes" select="$entry//t:note[@resp = '#editor']/normalize-space(.)"/>
        <xsl:variable name="head" select="if ($entry/t:head) then d:label($entry/t:head[1]) else ''"/>
        <xsl:variable name="tokens" select="for $e in $entry//*[@ana] return tokenize(normalize-space($e/@ana), ' ')"/>
        <xsl:variable name="dated" select="$tokens = '#uf_DatumUrfehde'"/>
        <xsl:variable name="image" select="substring-after(normalize-space($entry/preceding::t:pb[1]/@facs), '#')"/>
        <xsl:sequence select="
            if (some $n in $notes satisfies starts-with($n, 'Fortsetzung des Eintrags')) then 'fortsetzung'
            else if (not($entry/t:head) and not($dated) and matches($full, 'hab ich .{0,120}notari', 'i')) then 'fortsetzung'
            else if (matches($head, 'verschribne urphet', 'i') or matches($full, '^\W*Ich .{0,80}bek?h?enn?', 'i')) then 'urfehdbrief'
            else if ((some $n in $notes satisfies starts-with($n, 'Aussage gehört zu'))
                or (not($dated) and not($tokens = ('#uf_Urfehdeeid', '#uf_NotarialSubscription'))
                    and not(some $t in $tokens satisfies starts-with($t, '#uf_Strafe'))
                    and matches(substring($full, 1, 200), '(^|\W)(zeigt an|gibt disen bericht|sagt|bescheidt? .{0,20}geben)(\W|$)', 'i'))) then 'aussage'
            else if (some $n in $notes satisfies matches($n, 'bricht hier ab', 'i')) then 'abgebrochen'
            else if ($image = ('85', '86') and not($entry//t:metamark[lower-case(@rend) = 'kringel'])) then 'entwurf'
            else 'urfehde'"/>
    </xsl:function>

    <!-- editors' cross-references -->

    <!-- An editors' note cites other entries by heading and folio: "X kommt in einem anderen
         Urfehdeverfahren vor, siehe Urfehdeeintrag <heading> (fol. 59 verso)", "Aussage
         gehört zu Urfehdeeintrag <heading> (fol. …)", "Zu diesem Urfehdeeintrag gehört die
         Aussage <heading> (fol. …)" and "Fortsetzung des Eintrags über <heading> (fol. …)".
         Each cited heading becomes a d:x with the entry it resolves to, and a note on other
         proceedings a d:same for each person it names whose mention matches in both entries. -->
    <xsl:template name="xref">
        <xsl:param name="entry" as="element()"/>
        <xsl:variable name="note" select="."/>
        <xsl:variable name="t" select="normalize-space(.)"/>
        <xsl:variable name="intro" select="'^(Aussage gehört zu Urfehdeeintrag|Zu diesem Urfehdeeintrag gehört die Aussage|Fortsetzung des Eintrags über)'"/>
        <xsl:variable name="kind" select="
            if (matches($t, '^.+?\s+komm(t|en)\s+in\s')) then 'person'
            else if (starts-with($t, 'Fortsetzung des Eintrags über')) then 'continuation'
            else if (matches($t, $intro)) then 'statement'
            else ''"/>
        <xsl:if test="$kind != ''">
            <xsl:variable name="rest" select="if ($kind = 'person') then replace($t, '^.*?Urfe\w*', '') else replace($t, $intro, '')"/>
            <xsl:variable name="items" as="element()*">
                <xsl:analyze-string select="$rest" regex="([^()]+?)\s*\((fol\.?[^)]*)\)">
                    <xsl:matching-substring>
                        <xsl:variable name="cited" select="d:norm(replace(normalize-space(regex-group(1)), '^([\s,;:]*(und|vor|siehe|schon|Urfehdeeintr(äge|age|ag|äg)))+', ''))"/>
                        <d:x src="{$entry/@xml:id}" kind="{$kind}" cited="{$cited}"
                            target="{d:resolve($entry/@xml:id, $cited, d:cited-folios(regex-group(2)))}"/>
                    </xsl:matching-substring>
                </xsl:analyze-string>
            </xsl:variable>
            <xsl:sequence select="$items"/>
            <!-- "Die Gesellschaft bei …" names a group, not a person -->
            <xsl:variable name="subject" select="replace($t, '^(.+?)\s+komm(t|en)\s+in\s.*$', '$1')"/>
            <xsl:if test="$kind = 'person' and not(starts-with(lower-case($subject), 'die gesellschaft'))">
                <xsl:for-each select="tokenize($subject, ' und ')">
                    <xsl:variable name="name" select="d:norm(.)"/>
                    <!-- the person the note stands in or after, else the best match in the entry -->
                    <xsl:variable name="near" select="($note/parent::t:persName, $note/preceding-sibling::t:persName[1])"/>
                    <xsl:variable name="anchor" select="d:best-person($name, ($near, $near//t:persName))"/>
                    <xsl:variable name="from" select="if ($anchor and d:name-score($name, $anchor) ge 70) then $anchor else d:best-person($name, $entry//t:persName)"/>
                    <xsl:for-each select="$items[@target != '']">
                        <xsl:variable name="to" select="d:best-person($name, key('entry', @target, $root)//t:persName)"/>
                        <xsl:if test="$from and $to and d:name-score($name, $from) ge 75 and d:name-score($name, $to) ge 75">
                            <d:same from="{$from/@xml:id}" to="{$to/@xml:id}"/>
                        </xsl:if>
                    </xsl:for-each>
                </xsl:for-each>
            </xsl:if>
        </xsl:if>
    </xsl:template>

    <!-- "fol. 7 recto/ verso" as the folio labels of d:folio, 7r and 7v -->
    <xsl:function name="d:cited-folios" as="xs:string*">
        <xsl:param name="text" as="xs:string"/>
        <xsl:variable name="tokens" as="xs:string*">
            <xsl:analyze-string select="$text" regex="[0-9]+a?|recto|verso">
                <xsl:matching-substring>
                    <xsl:sequence select="."/>
                </xsl:matching-substring>
            </xsl:analyze-string>
        </xsl:variable>
        <xsl:sequence select="for $i in 1 to count($tokens)
            return if ($tokens[$i] = ('recto', 'verso'))
                then (for $n in ($tokens[position() lt $i][matches(., '^[0-9]')])[last()] return concat($n, substring($tokens[$i], 1, 1)))
                else ()"/>
    </xsl:function>

    <!-- The cited entry: the entry on a cited folio whose heading or opening matches the
         cited heading best, else the best on a page next to one, else, where the folio is
         wrong, the one entry of the book that matches clearly better than any other. The
         thresholds are similarities of d:dice, set so the rule reproduces
         research-artefacts/editorial-crossrefs.tsv, and stable between 50 and 70. -->
    <xsl:function name="d:resolve" as="xs:string">
        <xsl:param name="src" as="xs:string"/>
        <xsl:param name="cited" as="xs:string"/>
        <xsl:param name="want" as="xs:string*"/>
        <xsl:variable name="others" select="$entry-index[@id != $src]"/>
        <xsl:variable name="on-folio" select="d:pick($cited, $others[tokenize(@folios, ' ') = $want], $want)"/>
        <xsl:variable name="near" select="for $f in $want return number(($page-index[@folio = $f])[1]/@pos)"/>
        <xsl:variable name="on-next-page" select="d:pick($cited, $others[some $p in tokenize(@poss, ' ') satisfies some $w in $near satisfies abs(number($p) - $w) le 1], $want)"/>
        <xsl:sequence select="
            if ($on-folio != '') then $on-folio
            else if ($on-next-page != '') then $on-next-page
            else d:unique($cited, $others)"/>
    </xsl:function>

    <!-- the best candidate with a similarity of at least 60; among those within 3 of the
         best, the one whose folios differ least from the cited ones, then the first -->
    <xsl:function name="d:pick" as="xs:string">
        <xsl:param name="cited" as="xs:string"/>
        <xsl:param name="candidates" as="element()*"/>
        <xsl:param name="want" as="xs:string*"/>
        <xsl:variable name="scored" as="element()*">
            <xsl:for-each select="$candidates">
                <xsl:variable name="folios" select="tokenize(@folios, ' ')"/>
                <d:s id="{@id}" n="{@n}" score="{d:head-score($cited, .)}"
                    diff="{count($folios[not(. = $want)]) + count(distinct-values($want)[not(. = $folios)])}"/>
            </xsl:for-each>
        </xsl:variable>
        <xsl:variable name="best" select="max($scored/number(@score))"/>
        <xsl:variable name="top" as="element()*">
            <xsl:perform-sort select="$scored[number(@score) ge $best - 3]">
                <xsl:sort select="number(@diff)" data-type="number"/>
                <xsl:sort select="number(@n)" data-type="number"/>
            </xsl:perform-sort>
        </xsl:variable>
        <xsl:sequence select="if (exists($scored) and $best ge 60) then string($top[1]/@id) else ''"/>
    </xsl:function>

    <!-- the entry of the whole book that matches with at least 80 and 5 more than any other -->
    <xsl:function name="d:unique" as="xs:string">
        <xsl:param name="cited" as="xs:string"/>
        <xsl:param name="candidates" as="element()*"/>
        <xsl:variable name="scored" as="element()*">
            <xsl:perform-sort select="for $c in $candidates return d:scored($cited, $c)">
                <xsl:sort select="number(@score)" data-type="number" order="descending"/>
            </xsl:perform-sort>
        </xsl:variable>
        <xsl:sequence select="if (number($scored[1]/@score) ge 80 and number($scored[2]/@score) lt number($scored[1]/@score) - 5) then string($scored[1]/@id) else ''"/>
    </xsl:function>

    <xsl:function name="d:scored" as="element()">
        <xsl:param name="cited" as="xs:string"/>
        <xsl:param name="candidate" as="element()"/>
        <d:s id="{$candidate/@id}" score="{d:head-score($cited, $candidate)}"/>
    </xsl:function>

    <!-- a cited heading against the heading of an entry and against its opening words -->
    <xsl:function name="d:head-score" as="xs:double">
        <xsl:param name="cited" as="xs:string"/>
        <xsl:param name="entry" as="element()"/>
        <xsl:sequence select="max((if ($entry/@head != '') then d:dice($cited, $entry/@head) else 0,
            d:dice($cited, substring($entry/@text, 1, string-length($cited)))))"/>
    </xsl:function>

    <!-- The person mention whose name matches best, the shorter one where two match equally,
         since a persName may hold the name of a husband or father inside. -->
    <xsl:function name="d:best-person" as="element()?">
        <xsl:param name="name" as="xs:string"/>
        <xsl:param name="persons" as="element()*"/>
        <xsl:variable name="ranked" as="element()*">
            <xsl:perform-sort select="$persons[@xml:id][exists(d:entry(.))]">
                <xsl:sort select="round(d:name-score($name, .))" data-type="number" order="descending"/>
                <xsl:sort select="string-length(d:label(.))" data-type="number"/>
            </xsl:perform-sort>
        </xsl:variable>
        <xsl:sequence select="$ranked[1]"/>
    </xsl:function>

    <!-- a name against the forenames and surnames of a mention, and against every stretch
         of its text that starts with a word, since the name may follow an occupation -->
    <xsl:function name="d:name-score" as="xs:double">
        <xsl:param name="name" as="xs:string"/>
        <xsl:param name="person" as="element()"/>
        <xsl:variable name="parts" select="d:norm(string-join(($person/t:forename/d:label(.), $person/t:surname/d:label(.)), ' '))"/>
        <xsl:variable name="text" select="d:norm(d:label($person))"/>
        <xsl:variable name="starts" select="1, (for $i in index-of(string-to-codepoints($text), 32) return $i + 1)"/>
        <xsl:sequence select="max((if ($parts != '') then d:dice($name, $parts) else 0,
            for $s in $starts return d:dice($name, substring($text, $s, string-length($name)))))"/>
    </xsl:function>

    <!-- Lower case without diacritics and punctuation, the form in which headings and names
         are compared. -->
    <xsl:function name="d:norm" as="xs:string">
        <xsl:param name="text" as="xs:string?"/>
        <xsl:sequence select="normalize-space(replace(replace(normalize-unicode(lower-case(string($text)), 'NFKD'), '\p{M}', ''), '[^\p{L}\p{N}\s]', ' '))"/>
    </xsl:function>

    <!-- Similarity of two strings from 0 to 100, the Dice coefficient of their character
         bigrams counted with repetition. -->
    <xsl:function name="d:dice" as="xs:double">
        <xsl:param name="a" as="xs:string"/>
        <xsl:param name="b" as="xs:string"/>
        <xsl:variable name="ga" select="for $i in 1 to string-length($a) - 1 return substring($a, $i, 2)"/>
        <xsl:variable name="gb" select="for $i in 1 to string-length($b) - 1 return substring($b, $i, 2)"/>
        <xsl:variable name="n" select="count($ga) + count($gb)"/>
        <xsl:sequence select="if ($n = 0) then 0
            else 200 * sum(for $g in distinct-values($ga) return min((count($ga[. = $g]), count($gb[. = $g])))) div $n"/>
    </xsl:function>

    <!-- dates -->

    <!-- The written form of a date as the Basel scribes of the 1560s give it, read on the
         text in lower case without spaces and punctuation, since words break across lines. -->
    <xsl:variable name="weekdays" select="('sontag|sonntag', 'mentag|montag', 'zinstag|dinstag', 'mittwoch|mitwoch|mittoch',
        'donstag|donnerstag', 'fritag|frytag', 'sambstag|samstag|sampstag|sambtag|samtstag|sambsttag')"/>
    <xsl:variable name="months" select="('jenner|januar', 'hornung|hornugs|ornungs', 'mertz|merz|martij', 'aprilis|aprellen',
        'may|meygen|meigen|meygmonat', 'junij|juny|junii|brachmonat|brochmonat', 'julij|julii|höwmonat|howmonat|höwenmonat',
        'august|augstmonat|augstmon|augtstmonat|augsten|ougsten|augstmontas', 'septemb|herpstmonat|herbstmonat', 'octob',
        'novemb|nouemb', 'decemb')"/>
    <xsl:variable name="ordinals" select="('ersten', 'andren|andern', 'dritten', 'vierdten|vierten|viërdten', 'fünfften|fünffen|fünften',
        'sechsten', 'sybenden|sibenden', 'achtisten|achten', 'nündten|nünten|nünden', 'zechenden', 'elfften|eilfften', 'zwölfften')"/>
    <xsl:variable name="year-words" select="'(ditz|diss|dizt|diz|dizz|disses|dess|anno|domini|dit)'"/>

    <!-- How a coded date contradicts its written form or its entry, each a d:c with the kind
         of conflict and a suggested date where one follows:
         - The written date differs from the coded one: confirmed by the Julian weekday of
           the text, which then is the suggestion, or the weekday confirms the coded date, or
           no written weekday decides. A written date without year takes the coded year.
         - A year outside the sixteenth century, with the coded day and month in the year
           that puts a deed before and a deadline after the Urfehde of the entry.
         - Otherwise a deed dated after the Urfehde of its entry. -->
    <xsl:function name="d:date-conflicts" as="element()*">
        <xsl:param name="span" as="element()"/>
        <xsl:variable name="when" select="normalize-space($span/self::t:date/@when)"/>
        <xsl:variable name="kind" select="substring-after(d:cats($span)[starts-with(., 'Datum')][1], 'Datum')"/>
        <xsl:if test="matches($when, '^[0-9]{4}-[0-9]{2}-[0-9]{2}$')">
            <xsl:variable name="c" select="replace(lower-case(d:label($span)), '[^\p{L}\p{N}]', '')"/>
            <xsl:variable name="cy" select="xs:integer(substring($when, 1, 4))"/>
            <xsl:variable name="weekday" select="(for $i in 1 to 7 return $i[matches($c, $weekdays[$i])])[1] - 1"/>
            <xsl:variable name="month" select="(for $i in 1 to 12 return $i[matches($c, $months[$i])])[1]"/>
            <xsl:variable name="year" select="
                if (matches($c, '15[0-9][0-9]')) then xs:integer(replace($c, '^.*?(15[0-9][0-9]).*$', '$1'))
                else if (matches($c, concat($year-words, '[0-9][0-9]([^0-9]|$)'))) then 1500 + xs:integer(replace($c, concat('^.*?', $year-words, '([0-9][0-9])([^0-9].*)?$'), '$2'))
                else $cy"/>
            <!-- the first number of one or two digits that is no year; a tree, so that each
                 number has the text before it as its preceding sibling -->
            <xsl:variable name="parts">
                <xsl:analyze-string select="$c" regex="[0-9]+">
                    <xsl:matching-substring>
                        <d:n>
                            <xsl:value-of select="."/>
                        </d:n>
                    </xsl:matching-substring>
                    <xsl:non-matching-substring>
                        <d:t>
                            <xsl:value-of select="."/>
                        </d:t>
                    </xsl:non-matching-substring>
                </xsl:analyze-string>
            </xsl:variable>
            <xsl:variable name="number" select="($parts/d:n[string-length(.) le 2][xs:integer(.) ge 1 and xs:integer(.) le 31]
                [not(matches(string(preceding-sibling::*[1][self::d:t]), concat($year-words, '$')))])[1]"/>
            <xsl:variable name="day" select="
                if ($number) then xs:integer($number)
                else if (exists((for $i in 1 to 12 return $i[matches($c, $ordinals[$i])])[1])) then (for $i in 1 to 12 return $i[matches($c, $ordinals[$i])])[1]
                else if (matches($c, 'letsten|letzten') and exists($month)) then d:month-length($year, $month)
                else ()"/>
            <xsl:variable name="written" select="if (exists($day) and exists($month)) then concat($year, '-', d:two($month), '-', d:two($day)) else ''"/>
            <xsl:variable name="outside" select="$cy lt 1500 or $cy gt 1599"/>
            <xsl:if test="$written != '' and $written != $when">
                <d:c kind="{
                    if (empty($weekday)) then 'writtenDateDiffers'
                    else if (d:weekday($year, $month, $day) = $weekday) then 'writtenDateConfirmed'
                    else if (d:weekday($cy, xs:integer(substring($when, 6, 2)), xs:integer(substring($when, 9, 2))) = $weekday) then 'codedDateConfirmed'
                    else 'writtenDateDiffers'}"
                    suggested="{if (exists($weekday) and d:weekday($year, $month, $day) = $weekday) then $written else ''}"/>
            </xsl:if>
            <xsl:variable name="oath" select="normalize-space((d:entry($span)//t:date[tokenize(@ana, '\s+') = '#uf_DatumUrfehde'][@when])[1]/@when)"/>
            <xsl:if test="$outside">
                <xsl:variable name="md" select="substring($when, 6)"/>
                <xsl:variable name="uy" select="if (matches($oath, '^[0-9]{4}-')) then xs:integer(substring($oath, 1, 4)) else ()"/>
                <d:c kind="yearOutsideBook" suggested="{
                    if (empty($uy) or string-length($oath) != 10) then ''
                    else if ($kind = 'Tat') then concat(if ($md le substring($oath, 6)) then $uy else $uy - 1, '-', $md)
                    else if ($kind = 'Frist') then concat(if ($md ge substring($oath, 6)) then $uy else $uy + 1, '-', $md)
                    else ''}"/>
            </xsl:if>
            <xsl:if test="not($outside) and $kind = 'Tat' and $oath != '' and $when gt $oath">
                <d:c kind="deedAfterOath" suggested=""/>
            </xsl:if>
        </xsl:if>
    </xsl:function>

    <!-- weekday of a Julian date, 0 for Sunday, from its Julian day number -->
    <xsl:function name="d:weekday" as="xs:integer">
        <xsl:param name="y" as="xs:integer"/>
        <xsl:param name="m" as="xs:integer"/>
        <xsl:param name="d" as="xs:integer"/>
        <xsl:variable name="a" select="(14 - $m) idiv 12"/>
        <xsl:variable name="yy" select="$y + 4800 - $a"/>
        <xsl:variable name="mm" select="$m + 12 * $a - 3"/>
        <xsl:sequence select="($d + (153 * $mm + 2) idiv 5 + 365 * $yy + $yy idiv 4 - 32083 + 1) mod 7"/>
    </xsl:function>

    <xsl:function name="d:month-length" as="xs:integer">
        <xsl:param name="y" as="xs:integer"/>
        <xsl:param name="m" as="xs:integer"/>
        <xsl:sequence select="(31, if ($y mod 4 = 0) then 29 else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31)[$m]"/>
    </xsl:function>

    <xsl:function name="d:two" as="xs:string">
        <xsl:param name="n" as="xs:integer"/>
        <xsl:sequence select="if ($n lt 10) then concat('0', $n) else string($n)"/>
    </xsl:function>

    <!-- labels, also used by local-test-build/exploration-data.xsl: notes and deleted text
         left out, words split by a break with break="no" joined -->

    <xsl:function name="d:label" as="xs:string">
        <xsl:param name="node" as="element()"/>
        <xsl:variable name="text">
            <xsl:apply-templates select="$node/node()" mode="label"/>
        </xsl:variable>
        <!-- the whitespace of XML written out, since SaxonJS also reads the em space of the
             TEI as \s, which Saxon on GAMS does not -->
        <xsl:sequence select="normalize-space(replace(string($text), '[ &#9;&#10;&#13;]*&#xE000;[ &#9;&#10;&#13;]*', ''))"/>
    </xsl:function>

    <xsl:template match="t:note | t:del" mode="label"/>

    <!-- the reading text of an entry, which keeps the marginal notes of the manuscript and
         leaves out the editors' notes, whose wording the edition adds -->
    <xsl:function name="d:reading-text" as="xs:string">
        <xsl:param name="node" as="element()"/>
        <xsl:variable name="text">
            <xsl:apply-templates select="$node/node()" mode="reading"/>
        </xsl:variable>
        <xsl:sequence select="normalize-space(replace(string($text), '[ &#9;&#10;&#13;]*&#xE000;[ &#9;&#10;&#13;]*', ''))"/>
    </xsl:function>

    <xsl:template match="t:note[@resp = '#editor'] | t:del" mode="reading"/>

    <xsl:template match="t:lb[@break = 'no'] | t:pb[@break = 'no']" mode="reading">
        <xsl:text>&#xE000;</xsl:text>
    </xsl:template>

    <xsl:template match="t:lb | t:pb | t:metamark" mode="reading">
        <xsl:text> </xsl:text>
    </xsl:template>

    <!-- the private-use character marks a join and is removed with the space around it -->
    <xsl:template match="t:lb[@break = 'no'] | t:pb[@break = 'no']" mode="label">
        <xsl:text>&#xE000;</xsl:text>
    </xsl:template>

    <xsl:template match="t:lb | t:pb | t:metamark" mode="label">
        <xsl:text> </xsl:text>
    </xsl:template>

</xsl:stylesheet>

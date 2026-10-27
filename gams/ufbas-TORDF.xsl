
<xsl:stylesheet xmlns:cei="http://www.cei.lmu.de/ns/1.0" xmlns:crm="http://www.cidoc-crm.org/cidoc-crm" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:fedora-rels-ext="info:fedora/fedora-system:def/relations-external#" xmlns:g2o="http://gams.uni-graz.at/ontology/#" xmlns:gl="http://www.xbrl.org/GLTaxonomy/" xmlns:oa="http://www.w3.org/ns/oa#" xmlns:owl="http://www.w3.org/2002/07/owl#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:skos="http://www.w3.org/2004/02/skos/core#" xmlns:tei="http://www.tei-c.org/ns/1.0" xmlns:uf="http://gams.uni-graz.at/ufbas/#" xmlns:xd="http://www.oxygenxml.com/ns/doc/xsl" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" exclude-result-prefixes="xs" version="2.0" xpath-default-namespace="http://www.tei-c.org/ns/1.0">
  <xsl:output encoding="UTF-8" indent="yes" method="xml"></xsl:output>
  
  <xsl:variable name="prefixes">
    <uf>http://gams.uni-graz.at/ufbas/#</uf>
    <cei>http://www.cei.lmu.de/ns/1.0</cei>
    <g2o>http://gams.uni-graz.at/ontology/#</g2o>
    <dc>http://purl.org/dc/elements/1.1/</dc>
    <owl>http://www.w3.org/2002/07/owl#</owl>
    <rdf>http://www.w3.org/1999/02/22-rdf-syntax-ns#</rdf>
    <fedora-rels-ext>info:fedora/fedora-system:def/relations-external#</fedora-rels-ext>
    <skos>http://www.w3.org/2004/02/skos/core#</skos>
    <tei>http://www.tei-c.org/ns/1.0</tei>
    <oa>http://www.w3.org/ns/oa#</oa>
    <crm>http://www.cidoc-crm.org/cidoc-crm</crm>
  </xsl:variable>
  
  
  <xsl:variable name="pid" select="/TEI/teiHeader/fileDesc/publicationStmt/idno[@type=&apos;PID&apos;]"></xsl:variable>
  <xsl:variable name="server">http://gams.uni-graz.at/</xsl:variable>
  <xsl:variable name="documentURI">
    <xsl:value-of select="$server"></xsl:value-of>
    <xsl:value-of select="$pid"></xsl:value-of>
    <xsl:text>#</xsl:text>
  </xsl:variable>
  
  <xsl:variable name="projektURI">
    <xsl:text>http://gams.uni-graz.at/ufbas/#</xsl:text>
  </xsl:variable>
  <xsl:variable name="taxonomy" select="//taxonomy"></xsl:variable>
  <xd:doc>
    <xd:desc>Die folgenden Variablen listen TEI-Elemente auf, die als RDF-Aussagen interpretiert werden. Im @uf-Attribut wird eine ggf. vorhadenene identische lokale-Entität abgelegt</xd:desc>
  </xd:doc>
  <xsl:variable name="Element2Entity">
    <uf:element uf="Person">persName</uf:element>
    <uf:element uf="Ort">placeName</uf:element>
    <uf:element>roleName</uf:element>
  </xsl:variable>
  <xsl:variable name="Element2Property">
    <uf:element>forename</uf:element>
    <uf:element>surname</uf:element>
  </xsl:variable>
  
  <xsl:template match="/">
    <rdf:RDF>
      <xsl:apply-templates select="//*[matches(@ana, &apos;#(uf|cei)_[A-Z]&apos;) or name()=$Element2Entity/uf:element/text()]"></xsl:apply-templates>
      <xsl:if test="starts-with(/TEI/teiHeader[1]/fileDesc[1]/titleStmt[1]/title[1],&apos;Erschliessungskategorien des Projekts&apos;)">
        <xsl:apply-templates select="//taxonomy[@xml:id=&apos;Urfehdekodierung&apos;]"></xsl:apply-templates>
      </xsl:if>
      
      
      
      <xsl:apply-templates select="/TEI/text/back/listPlace/place"></xsl:apply-templates>
    </rdf:RDF>
  </xsl:template>
  
  <xd:doc>
    <xd:desc>Als erstes die Texte</xd:desc>
  </xd:doc>
  <xsl:template match="*[matches(@ana,&apos;#(uf|cei)_&apos;) or name()=$Element2Entity/uf:element/text() or name()=$Element2Property/uf:element/text()]" mode="texte" priority="-1">
    <xsl:variable name="seite" select="uf:doc-uri(preceding::pb[1])"></xsl:variable>
    
    <rdf:Description>
      <xsl:attribute name="rdf:about" select="uf:doc-uri(.)"></xsl:attribute>
      <g2o:appears-on rdf:resource="{$seite}"></g2o:appears-on>
      <g2o:inhalt>
        
        <xsl:value-of select="./normalize-space()"></xsl:value-of>
      </g2o:inhalt>
      <g2o:isPartOf rdf:resource="{$documentURI}"></g2o:isPartOf>
      
    </rdf:Description>
  </xsl:template>
  <xd:doc>
    <xd:desc>Dann die Entitäten</xd:desc>
    
  </xd:doc>
  <xsl:template match="*[matches(@ana, &apos;#(uf|cei)_[A-Z]&apos;) or name()=$Element2Entity/uf:element/text()]">
    <xsl:variable name="uri" select="uf:doc-uri(.)"></xsl:variable>
    <xsl:variable name="enames">
      <xsl:variable name="pattern">
        <xsl:text>#((uf|cei)_[A-Z]\S*)</xsl:text>
      </xsl:variable>
      <xsl:if test="@ana">
        <xsl:analyze-string regex="{$pattern}" select="@ana">
          <xsl:matching-substring>
            <uf:ename>
              <xsl:value-of select="regex-group(1)"></xsl:value-of>
            </uf:ename>
          </xsl:matching-substring>
        </xsl:analyze-string>
      </xsl:if>
      <xsl:choose>
        <xsl:when test="name()=&apos;persName&apos;">
          <uf:ename>
            <xsl:text>uf_Person</xsl:text>
          </uf:ename>
        </xsl:when>
        <xsl:when test="name()=&apos;placeName&apos;">        
  <uf:ename>
            <xsl:text>uf_Ort</xsl:text>
          </uf:ename>
        </xsl:when>
        <xsl:when test="not(matches(@ana,$pattern))">
          <uf:ename>
            <xsl:text>uf_</xsl:text>
            <xsl:value-of select="name()"></xsl:value-of>
          </uf:ename>
        </xsl:when>
      </xsl:choose>
    </xsl:variable>
    <xsl:variable name="curr-id" select="generate-id()"></xsl:variable>
    <xsl:variable name="me-id" select="uf:uri(.)"></xsl:variable>
    <xsl:variable name="ref" select="@ref"></xsl:variable>
    <xsl:variable name="properties">
      
      <xsl:apply-templates mode="property" select=".//*[matches(@ana,&apos;#(uf|cei)_[a-z]&apos;) or name()=$Element2Property/uf:element/text()][ancestor::*[matches(@ana,&apos;#(uf|cei)_&apos;) or name()=$Element2Property/uf:element/text() or  name()=$Element2Entity/uf:element/text()][1]/generate-id() = $curr-id]"></xsl:apply-templates>
      
      <xsl:apply-templates mode="property" select=".//*[matches(@ana,&apos;#(uf|cei)_[A-Z]&apos;) or  name()=$Element2Entity/uf:element/text()][ancestor::*[matches(@ana,&apos;#(uf|cei)_&apos;) or name()=$Element2Property/uf:element/text() or name()=$Element2Entity/uf:element/text()][1]/generate-id() = $curr-id]"></xsl:apply-templates>
      <xsl:if test="@when">
        <tei:when>
          <xsl:value-of select="@when"></xsl:value-of>
        </tei:when>
        
      </xsl:if>
    </xsl:variable>
    
    <xsl:apply-templates mode="texte" select="."></xsl:apply-templates>
    
    <xsl:for-each select="$enames/uf:ename">
      <xsl:variable name="class" select="replace(.,&apos;(uf|cei)_&apos;, &apos;&apos;)"></xsl:variable>
      <xsl:variable name="typ-cat" select="$taxonomy//category[@xml:id=concat(&apos;uf_&apos;,$class)]/ancestor::*[matches(@xml:id,&apos;(uf|cei)_[A-Z]&apos;)][1]/replace(@xml:id,&apos;^.*?(uf|cei)_([A-Z]\S*?)( .*?$|$)&apos;,&apos;$2&apos;)"></xsl:variable>
      <xsl:element name="uf:{$class}" namespace="{$projektURI}">
        <xsl:variable name="id">
          <xsl:choose>
            <xsl:when test="$ref">
              <xsl:if test="starts-with($ref,&apos;#&apos;)">
                <xsl:value-of select="translate($documentURI,&apos;#&apos;,&apos;&apos;)"></xsl:value-of>
              </xsl:if>
              <xsl:value-of select="$ref"></xsl:value-of>
            </xsl:when>
            <xsl:otherwise>
              <xsl:value-of select="concat($documentURI,$class,&apos;-&apos;,$me-id)"></xsl:value-of>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:variable>
        <xsl:attribute name="rdf:about" select="$id"></xsl:attribute>
        
        <xsl:if test="$typ-cat!=&apos;&apos;">
          <rdf:type rdf:resource="{concat($projektURI,$typ-cat)}"></rdf:type>
        </xsl:if>
        <oa:hasTarget rdf:resource="{concat($documentURI,$me-id)}"></oa:hasTarget>
        <xsl:for-each select="//category[@xml:id = concat(&apos;uf_&apos;, ename)]/ancestor::category">
          <rdf:type rdf:resource="{replace(@xml:id,&apos;uf_&apos;,$projektURI)}"></rdf:type>
        </xsl:for-each>
        
        <xsl:copy-of select="$properties"></xsl:copy-of>
      </xsl:element>
    </xsl:for-each>
    <xsl:apply-templates select=".//*[matches(@ana,&apos;#(uf|cei)_[a-z]&apos;)]"></xsl:apply-templates>
  </xsl:template>
  <xd:doc>
    <xd:desc>Hier die Properties</xd:desc>
  </xd:doc>
  <xsl:template match="*[matches(@ana,&apos;#(uf|cei)_[a-z]&apos;) or name()=$Element2Property/uf:element/text()]" mode="property" priority="-1">
    <xsl:variable name="curr-id" select="generate-id()"></xsl:variable>
    <xsl:variable name="tax" select="replace(@ana,&apos;^.*?#(uf|cei)_([a-z]\S*?)( .*?$|$)&apos;,&apos;$2&apos;)"></xsl:variable>
    <xsl:variable name="typ-cat" select="$taxonomy//category[@xml:id=concat(&apos;uf_&apos;,$tax)]/ancestor::*[matches(@xml:id,&apos;(uf|cei)_[A-Z]&apos;)][1]/replace(@xml:id,&apos;^.*?(uf|cei)_([A-Z]\S*?)( .*?$|$)&apos;,&apos;$2&apos;)"></xsl:variable>
    <xsl:variable name="range">
      <xsl:if test="$typ-cat !=&apos;&apos;">
        <xsl:value-of select="$projektURI"></xsl:value-of>
        <xsl:value-of select="$typ-cat"></xsl:value-of>
      </xsl:if>
    </xsl:variable>
    <xsl:variable name="properties">
      <xsl:apply-templates mode="property" select=".//*[matches(@ana,&apos;#(uf|cei)_[a-z]&apos;) or name()=$Element2Property/uf:element/text()][ancestor::*[matches(@ana,&apos;#(uf|cei)_&apos;)  or name()=$Element2Property/uf:element/text() or name()=$Element2Entity/uf:element/text()][1]/generate-id() = $curr-id]"></xsl:apply-templates>
      <xsl:apply-templates mode="property" select=".//*[matches(@ana,&apos;#(uf|cei)_[A-Z]&apos;) or name()=$Element2Entity/uf:element/text()][ancestor::*[matches(@ana,&apos;#(uf|cei)_&apos;)  or name()=$Element2Property/uf:element/text() or name()=$Element2Entity/uf:element/text()][1]/generate-id() = $curr-id]"></xsl:apply-templates>
      <xsl:if test="@when">
        <tei:when>
          <xsl:value-of select="@when"></xsl:value-of>
        </tei:when>
        
      </xsl:if>
    </xsl:variable>
    <xsl:variable name="name">
      <xsl:choose>
        <xsl:when test="matches(@ana,&apos;#(uf|cei)_&apos;)">
          <xsl:value-of select="replace(@ana,&apos;#(uf|cei)_&apos;,&apos;$1:&apos;)"></xsl:value-of>
        </xsl:when>
        <xsl:otherwise>
          <xsl:text>uf:</xsl:text>
          <xsl:value-of select="lower-case(substring(name(),1,1))"></xsl:value-of>
          <xsl:value-of select="substring(name(),2)"></xsl:value-of>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <xsl:element name="{$name}">
      
      <xsl:value-of select="."></xsl:value-of>
    </xsl:element>
  </xsl:template>
  <xsl:template match="*[matches(@ana,&apos;#(uf|cei)_[A-Z]&apos;) or name()=$Element2Entity/uf:element/text()]" mode="property" priority="-1">
    <xsl:variable name="me-id" select="uf:uri(.)"></xsl:variable>
    <xsl:variable name="ref" select="@ref"></xsl:variable>
    <xsl:variable name="class">
      <xsl:choose>
        <xsl:when test="matches(@ana,&apos;#(uf|cei)_&apos;)">
          <xsl:value-of select="replace(@ana,&apos;^.*?#(uf|cei)_([A-Z]\S*?)( .*?$|$)&apos;,&apos;$2&apos;)"></xsl:value-of>
        </xsl:when>
        
        <xsl:when test="$Element2Entity/uf:element[text()=name(current())][@uf]">
          <xsl:value-of select="$Element2Entity/uf:element[text()=name(current())]/@uf"></xsl:value-of>
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="upper-case(substring(name(),1,1))"></xsl:value-of>
          <xsl:value-of select="substring(name(),2)"></xsl:value-of>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <xsl:variable name="typ-cat" select="$taxonomy//category[@xml:id=concat(&apos;uf_&apos;,$class)]/ancestor::*[matches(@xml:id,&apos;(uf|cei)_[A-Z]&apos;)][1]/replace(@xml:id,&apos;^.*?(uf|cei)_([A-Z]\S*?)( .*?$|$)&apos;,&apos;$2&apos;)"></xsl:variable>
    <xsl:variable name="typ">
      <xsl:choose>
        <xsl:when test="$typ-cat !=&apos;&apos;">
          <xsl:value-of select="$typ-cat"></xsl:value-of>
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="$class"></xsl:value-of>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <xsl:variable name="id">
      <xsl:choose>
        <xsl:when test="$ref">
          <xsl:if test="starts-with($ref,&apos;#&apos;)">
            <xsl:value-of select="substring-before($documentURI,&apos;#&apos;)"></xsl:value-of>
          </xsl:if>
          <xsl:value-of select="$ref"></xsl:value-of>
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="concat($documentURI,$class,&apos;-&apos;,$me-id)"></xsl:value-of>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <xsl:element name="{concat(&apos;uf:has&apos;,$typ)}">
      
      <xsl:attribute name="rdf:resource" select="$id"></xsl:attribute>
    </xsl:element>
  </xsl:template>
  <xd:doc>
    <xd:desc>Spezielle Properties</xd:desc>
  </xd:doc>
  <xsl:template match="*[matches(@ana,&apos;#uf_(fe)?male&apos;)]" mode="property">
    <uf:gender rdf:resource="{concat($projektURI,replace(@ana,&apos;^.*?#uf_((fe)?male).*?$&apos;,&apos;$1&apos;))}"></uf:gender>
    <xsl:element name="uf:{name()}">
      <xsl:value-of select="./normalize-space()"></xsl:value-of>
    </xsl:element>
  </xsl:template>
  <xsl:template match="*[matches(@ana,&apos;#cei_notarialSubscription&apos;)]" mode="property">
    <xsl:element name="cei:notarialSubscription">
      <xsl:value-of select="./normalize-space()"></xsl:value-of>
    </xsl:element>
    <xsl:apply-templates mode="property" select="*[matches(@ana,&apos;#(uf|cei)_&apos;) or name()=$Element2Property/uf:element/text() or name()=$Element2Entity/uf:element/text()]"></xsl:apply-templates>
  </xsl:template>
  <xd:doc>
    <xd:desc>uf:doc-uri() erzeugt eine URI einer Textstelle, die es ermöglicht, die Textstelle in der gams aufzurufen</xd:desc>
  </xd:doc>
  <xsl:function name="uf:doc-uri">
    <xsl:param name="me"></xsl:param>
    <xsl:value-of select="$documentURI"></xsl:value-of>
    
    <xsl:choose>
      <xsl:when test="$me/@xml:id">
        <xsl:value-of select="$me/@xml:id"></xsl:value-of>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$me/ generate-id()"></xsl:value-of>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:function>
  <xd:doc>
    <xd:desc>Die Kategorienbeschreibungen</xd:desc>
  </xd:doc>
  <xsl:template match="//taxonomy[@xml:id=&apos;Urfehdekodierung&apos;]">
    <xsl:apply-templates></xsl:apply-templates>
  </xsl:template>
  <xsl:template match="category">
    <skos:Concept rdf:about="{uf:expand-uri(@xml:id)}">
      <xsl:apply-templates select="catDesc//(term|name)[1]"></xsl:apply-templates>
      <xsl:apply-templates select="catDesc"></xsl:apply-templates>
      <xsl:if test="ancestor::category">
        <skos:broader rdf:resource="{$projektURI}{ancestor::category[1]/replace(@xml:id,&apos;(uf|cei)_&apos;,&apos;&apos;)}"></skos:broader>
      </xsl:if>
    </skos:Concept>
    <xsl:apply-templates select="category"></xsl:apply-templates>
  </xsl:template>
  <xsl:template match="catDesc//term|catDesc//name">
    <skos:prefLabel xml:lang="de">
      <xsl:value-of select="."></xsl:value-of>
    </skos:prefLabel>
  </xsl:template>
  <xsl:template match="catDesc">
    <skos:defintion xml:lang="de">
      <xsl:value-of select="normalize-space(.)"></xsl:value-of>
    </skos:defintion>
  </xsl:template>
  <xd:doc>
    <xd:desc>uf:class-uri() erzeugt eine URI zu einer in einer Textstelle belegten Sache entweder aus einer explizit benannten @ref oder zusammengabaut aus dem lokalen Kontext </xd:desc>
  </xd:doc>
  <xsl:function name="uf:class-uri">
    <xsl:param name="me"></xsl:param>
    <xsl:param name="class"></xsl:param>
    <xsl:choose>
      <xsl:when test="$me/@ref">
        <xsl:value-of select="$me/@ref"></xsl:value-of>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$projektURI"></xsl:value-of>
        <xsl:text>#</xsl:text>
        <xsl:value-of select="$class"></xsl:value-of>
        <xsl:text>-</xsl:text>
        <xsl:value-of select="$pid"></xsl:value-of>
        <xsl:text>-</xsl:text>
        <xsl:choose>
          <xsl:when test="$me/@xml:id">
            <xsl:value-of select="$me/@xml:id"></xsl:value-of>
          </xsl:when>
          <xsl:otherwise>
            <xsl:value-of select="$me/generate-id()"></xsl:value-of>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:function>
  <xd:doc>
    <xd:desc>xml:id und @ana verwenden eine interne URI-Schreibweise: <i>namensraum</i>_<i>id</i>, die hier auf die definierten Namensräume expandiert wird</xd:desc>
  </xd:doc>
  <xsl:function name="uf:expand-uri">
    <xsl:param name="abbr-uri"></xsl:param>
    <xsl:for-each select="$prefixes/*">
      <xsl:variable name="ns">
        <xsl:value-of select="."></xsl:value-of>
        <xsl:if test="not(ends-with(.,&apos;#&apos;))">
          <xsl:text>#</xsl:text>
        </xsl:if>
      </xsl:variable>
      <xsl:if test="starts-with($abbr-uri,concat(name(),&apos;_&apos;))">
        <xsl:value-of select="replace($abbr-uri,concat(name(),&apos;_&apos;),$ns)"></xsl:value-of>
      </xsl:if>
    </xsl:for-each>
  </xsl:function>
  <xd:doc>
    <xd:desc>IDs entweder aus xml:id oder generate-id</xd:desc>
  </xd:doc>
  <xsl:function name="uf:uri">
    <xsl:param name="me"></xsl:param>
    <xsl:choose>
      <xsl:when test="$me/@xml:id">
        <xsl:value-of select="$me/@xml:id"></xsl:value-of>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$me/generate-id()"></xsl:value-of>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:function>
  <xd:doc>
    <xd:desc>uf:type ermittelt den Datentyp aus der Taxonomie</xd:desc>
  </xd:doc>
  <xsl:function name="uf:type">
    <xsl:param name="type-id"></xsl:param>
    <xsl:value-of select="$taxonomy//category[@xml:id = $type-id]/@xml:id"></xsl:value-of>
  </xsl:function>
  <xd:doc>
    <xd:desc>Erzeugt die Basisaussagen aus der Ortsliste</xd:desc>
  </xd:doc>
  <xsl:template match="place">
    <uf:Ort rdf:about="{$documentURI}{@xml:id}">
      <xsl:for-each select="placeName">
        <skos:prefLabel>
          <xsl:value-of select="."></xsl:value-of>
        </skos:prefLabel>
      </xsl:for-each>
    </uf:Ort>
  </xsl:template>
  <xd:doc>
    <xd:desc>Nicht zu berücksichtigende Elemente</xd:desc>
  </xd:doc>
  <xsl:template match="teiHeader|text()" priority="-2"></xsl:template>
  <xsl:template match="text()" mode="Sachverhalt" priority="-2"></xsl:template>
  
</xsl:stylesheet>

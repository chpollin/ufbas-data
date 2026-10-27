
<xsl:stylesheet xmlns:t="http://www.tei-c.org/ns/1.0" xmlns:xd="http://www.oxygenxml.com/ns/doc/xsl" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" exclude-result-prefixes="xs xd" version="2.0">
  <xsl:output encoding="UTF-8" indent="no" method="xml" xml:space="preserve"></xsl:output>
  <xd:doc>
    <xd:desc>Führt explizite xml:id für alle im RDF ausgewerteten Elemente ein</xd:desc>
  </xd:doc>
  <xsl:template match="/">
    <xsl:apply-templates></xsl:apply-templates>
  </xsl:template>
  <xsl:template match="t:*[matches(@ana,&apos;(^|\s)#&apos;)]|t:persName|t:placeName">
    <xsl:copy>
      <xsl:if test="not(@xml:id)">
        <xsl:attribute name="xml:id" select="generate-id()"></xsl:attribute>
      </xsl:if>
      <xsl:apply-templates select="@*|text()|comment()|processing-instruction()|*"></xsl:apply-templates>
    </xsl:copy>
  </xsl:template>
  <xsl:template match="t:text">
    <xsl:copy>
      <xsl:attribute name="xml:space">
        <xsl:text>preserve</xsl:text>
      </xsl:attribute>
      <xsl:apply-templates select="*|text()|@*|comment()|processing-instruction()"></xsl:apply-templates>
    </xsl:copy>
  </xsl:template>
  <xsl:template match="*" priority="-2">
    <xsl:copy>
      <xsl:apply-templates select="*|text()|@*|comment()|processing-instruction()"></xsl:apply-templates>
    </xsl:copy>
  </xsl:template>
  <xsl:template match="@*|text()|comment()|processing-instruction()" priority="-2">
    <xsl:copy></xsl:copy>
  </xsl:template>
</xsl:stylesheet>

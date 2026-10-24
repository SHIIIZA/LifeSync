import { Injectable } from '@angular/core';
import { RoutineItem } from '../models/lifesync.models';
import { sanitizeText } from '../shared/sanitize';

const VALID_CATEGORIES = ['study', 'chore', 'medication', 'personal'] as const;

// ILO 4: import routine logs from XML (DOM parsing) and transform them
// into HTML reports (XSLT).
@Injectable({ providedIn: 'root' })
export class XmlReportService {
  // Parse <items><item><title/><time/><category/></item></items> into
  // sanitized RoutineItems. Throws on malformed XML or bad fields.
  parseRoutineXml(xmlText: string): Array<Omit<RoutineItem, 'id'>> {
    const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
    if (doc.querySelector('parsererror')) {
      throw new Error('XML could not be parsed — check the file format.');
    }
    const items = Array.from(doc.getElementsByTagName('item'));
    if (!items.length) throw new Error('No <item> elements found in the XML.');

    return items.map((node, i) => {
      const title = sanitizeText(node.getElementsByTagName('title')[0]?.textContent ?? '');
      const time = sanitizeText(node.getElementsByTagName('time')[0]?.textContent ?? '');
      const categoryRaw = (node.getElementsByTagName('category')[0]?.textContent ?? 'personal')
        .trim()
        .toLowerCase();
      if (!title || !time) throw new Error(`Item ${i + 1}: missing title or time.`);
      if (!/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(time)) {
        throw new Error(`Item ${i + 1}: time "${time}" is not like "7:30 AM".`);
      }
      const category = VALID_CATEGORIES.includes(categoryRaw as any)
        ? (categoryRaw as RoutineItem['category'])
        : 'personal';
      return { title, time, category, done: false };
    });
  }

  // Build a small expense log as XML, then transform it with XSLT into an
  // HTML summary report and open it in a new tab.
  buildExpenseXml(expenses: Array<{ label: string; category: string; amount: number; date: string }>): string {
    const rows = expenses
      .map(
        (e) =>
          `<expense><label>${e.label}</label><category>${e.category}</category><amount>${e.amount.toFixed(2)}</amount><date>${e.date}</date></expense>`,
      )
      .join('');
    return `<?xml version="1.0" encoding="UTF-8"?><expenses>${rows}</expenses>`;
  }

  transformExpenseXmlToHtml(xmlText: string): string {
    const xslt = `<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/">
    <html><head><title>LifeSync Expense Report</title>
    <style>body{font-family:Georgia,serif;margin:2rem}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:6px 12px}h1{letter-spacing:-0.02em}</style>
    </head><body>
    <h1>LifeSync — Expense Summary</h1>
    <table><tr><th>Label</th><th>Category</th><th>Amount</th><th>Date</th></tr>
      <xsl:for-each select="expenses/expense">
        <tr><td><xsl:value-of select="label"/></td><td><xsl:value-of select="category"/></td><td>₱<xsl:value-of select="amount"/></td><td><xsl:value-of select="date"/></td></tr>
      </xsl:for-each>
    </table>
    <p>Total: ₱<xsl:value-of select="sum(expenses/expense/amount)"/></p>
    </body></html>
  </xsl:template>
</xsl:stylesheet>`;
    const xmlDoc = new DOMParser().parseFromString(xmlText, 'application/xml');
    const xsltDoc = new DOMParser().parseFromString(xslt, 'application/xml');
    const processor = new XSLTProcessor();
    processor.importStylesheet(xsltDoc);
    const result = processor.transformToDocument(xmlDoc);
    return new XMLSerializer().serializeToString(result);
  }
}

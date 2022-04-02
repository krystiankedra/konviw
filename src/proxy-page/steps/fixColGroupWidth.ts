import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import * as cheerio from 'cheerio';

/**
 * ### Proxy page step to fix colgroup width
 *
 * This module gets Cheerio to search all colgroup ('colgroup')
 * and convert the width to the proportional percentage
 * when the width sum of colgroup more than 1000
 *
 * @param  {ConfigService} config
 * @returns void
 */
export default (): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('fixColgroupWidth');
    const $ = context.getCheerioBody();
    $('colgroup').each((_index: number, elementColgroup: cheerio.Element) => {
      let sumColWidth = 0;
      const maxColWidth = 1000;
      elementColgroup.childNodes.forEach((elementColumn: cheerio.Element) => {
        sumColWidth += getElementValue(elementColumn);
      });
      if (sumColWidth > maxColWidth) {
        elementColgroup.childNodes.forEach((elementColumn: cheerio.Element) => {
          const newWidth = Math.round(
            (getElementValue(elementColumn) / sumColWidth) * 100,
          );
          elementColumn.attribs = { style: 'width: ' + newWidth + '%;' };
        });
      }
    });
    context.getPerfMeasure('fixColgroupWidth');
  };
};

function getElementValue(elementColumn: cheerio.Element): number {
  const attribs = JSON.parse(JSON.stringify(elementColumn.attribs));
  return Number(attribs.style?.match(/\d+/)[0]) ?? 0;
}

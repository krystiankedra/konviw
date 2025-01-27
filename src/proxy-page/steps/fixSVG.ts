import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import * as cheerio from 'cheerio';
import { ConfigService } from '@nestjs/config';

/**
 * ### Proxy page step to fix svg
 *
 * This module gets Cheerio to search all images ('img')
 * and set the source according to attribute 'data-encoded-xml'
 *
 * @param  {ConfigService} config
 * @returns void
 */
export default (config: ConfigService): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('fixSVG');
    const $ = context.getCheerioBody();
    const webBasePath = config.get('web.absoluteBasePath');

    $('img').each((_index: number, elementImg: cheerio.Element) => {
      const imgDataEncodedXml = $(elementImg).attr('data-encoded-xml');
      if (imgDataEncodedXml) {
        const decodedXML = (
          decodeURIComponent(imgDataEncodedXml) ?? ''
        ).replace(/\+/g, ' ');
        const decodedByCheerio = cheerio.load(decodedXML, { xmlMode: true });
        const tag = decodedByCheerio('ac\\:image')['0'];

        /* get the actual SVG attributes */
        const { 'ac:width': width = '', 'ac:align': align = '' } = tag?.attribs;
        const { 'ri:filename': filename = '' } =
          tag?.children?.shift()?.['attribs'];

        /* set the new imageSrc and width attributes */
        $(elementImg).attr(
          'src',
          `${webBasePath}/wiki/download/attachments/${context.getPageId()}/${filename}`,
        );
        $(elementImg).attr('width', width);
        const alignmentClass = {
          center: 'image-center',
          left: 'image-left',
          right: 'image-right',
        };
        if (align) {
          $(elementImg).addClass(alignmentClass[align]);
        }

        /* clean off attributes we don't need anymore */
        $(elementImg).removeAttr('data-encoded-xml');
        $(elementImg).removeClass('transform-error');
      }
    });

    context.getPerfMeasure('fixSVG');
  };
};

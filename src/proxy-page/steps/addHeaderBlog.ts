import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import { ConfluenceService } from '../../confluence/confluence.service';
import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';

export default (config: ConfigService, confluence: ConfluenceService): Step => {
  return async (context: ContextService): Promise<void> => {
    context.setPerfMark('addHeaderBlog');
    const $ = context.getCheerioBody();
    const webBasePath = config.get('web.absoluteBasePath');
    let blogImgSrc = context.getHeaderImage(); // default blog header is the headerImage
    if (blogImgSrc && !blogImgSrc.startsWith('http')) {
      // not a URL (image uploaded to Confluence)
      const attachments = await confluence.getAttachments(context.getPageId());
      const blogImgAttachment = attachments.find((e) => {
        return e?.extensions?.fileId === blogImgSrc; // find the attachment matching the UID got from the headerImage attribute
      });
      if (blogImgAttachment) {
        blogImgSrc = `${webBasePath}/wiki${blogImgAttachment?._links?.download}`;
      }
    }
    let blogExcerptString = '',
      blogHeaderHTML = '',
      blogExcerptHTML = '';

    // Div with class plugin-tabmeta-details is used for macro Page-Properties
    $(".plugin-tabmeta-details[data-macro-name='details']")
      // We just look for the first Page-Properties macro
      .first()
      .each((_index: number, pageProperties: cheerio.Element) => {
        const imgBlog = $(pageProperties).find('img');
        if (!blogImgSrc) {
          blogImgSrc = imgBlog?.attr('src'); // headerIMage has priority over page-proterties's image
        }
        blogExcerptString = $(pageProperties).find('blockquote')?.html();
        $(pageProperties).remove();
      });

    if (blogImgSrc) {
      blogHeaderHTML = `
        <div class="blog--header"
          style="background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
          url('${blogImgSrc}');">
          <div class="blog--box">
            <div class="blog--title">
              ${context.getTitle()}
            </div>
            <div>
              <img class="userLogo logo" src="${context.getAvatar()}">
              <div class="blog--vCard">
                <div class="blog--when">${context.getFriendlyWhen()} • ${context.getReadTime()} min read</div>
                <div>${context.getAuthor()}</div>
                <a href="mailto:${context.getEmail()}" class="blog--email">${context.getEmail()}</a>
              </div>
            </div>
          </div>
        </div>
        `;
    }
    if (blogExcerptString) {
      blogExcerptHTML = `
        <section class="blog--excerpt">
          <blockquote>${blogExcerptString}</blockquote>
        </section>
        `;
    }

    $('#Content').before(`
        ${blogHeaderHTML}
        ${blogExcerptHTML}
      `);

    context.getPerfMeasure('addHeaderBlog');
  };
};

import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('delUnnecessaryCode');
    const $ = context.getCheerioBody();

    // Remove buggy inline CSS from <head> (mix of CSS and SaSS) -> replaced by aui.css
    $('head > style').remove();

    // Remove <base ...> to fix TOC links
    $('base').remove();

    // Remove this Drawio script to remove unnecessary noise in the final HTML
    // Already parsed by fixDraw
    $('script.ap-iframe-body-script').each(
      (_index: number, element: CheerioElement) => {
        $(element).replaceWith('');
      },
    );

    // Remove this Drawio script to remove unnecessary noise in the final HTML
    // Already parsed by fixChar
    $('script.chart-render-data').each(
      (_index: number, element: CheerioElement) => {
        $(element).remove();
      },
    );

    // Remove button to insert templates in Confluence
    $('button.create-from-template-button').remove();
    context.getPerfMeasure('delUnnecessaryCode');
  };
};

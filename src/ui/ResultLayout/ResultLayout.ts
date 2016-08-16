import {Component} from '../Base/Component';
import {ComponentOptions} from '../Base/ComponentOptions';
import {IComponentBindings} from '../Base/ComponentBindings';
import {QueryEvents} from '../../events/QueryEvents';
import {Initialization} from '../Base/Initialization';
import {Assert} from '../../misc/Assert';
import {ResultListEvents, IChangeLayoutEventArgs} from '../../events/ResultListEvents';
import {ResultLayoutEvents, IResultLayoutPopulateArgs} from '../../events/ResultLayoutEvents';
import {$$} from '../../utils/Dom';
import {IQueryErrorEventArgs, IQuerySuccessEventArgs} from '../../events/QueryEvents';

export interface IResultLayoutOptions {
  defaultLayout: string;
}

/**
 * This component allows to change the ResultList layout.<br/>
 * By default, it provides 3 layouts, `list`, `card` and `table`.
 */
export class ResultLayout extends Component {
  static ID = 'ResultLayout';

  public static validLayouts = ['list', 'card', 'table'];

  private currentLayout: string;
  private buttons: { [key: string]: HTMLElement };
  private resultLayoutSection: HTMLElement;

  /**
   * @componentOptions
   */
  static options: IResultLayoutOptions = {
    /**
     * Specifies the default ResultList layout to use.<br/>
     * Possible values are `list`, `card` and `table`.<br/>
     * By default, it is set to `list`.
     */
    defaultLayout: ComponentOptions.buildStringOption({
      defaultValue: 'list',
      postProcessing: v => _.contains(ResultLayout.validLayouts, v) ? v : 'list'
    })
  }

  // TODO: add sticky url parameter
  constructor(public element: HTMLElement, public options?: IResultLayoutOptions, bindings?: IComponentBindings) {
    super(element, ResultLayout.ID, bindings);
    this.options = ComponentOptions.initComponentOptions(element, ResultLayout, options);

    this.buttons = {};

    Assert.exists(this.options.defaultLayout);
    this.bind.onRootElement(ResultLayoutEvents.resultLayoutPopulate, (args: IResultLayoutPopulateArgs) => this.handlePopulate(args));

    this.bind.onRootElement(QueryEvents.querySuccess, (args: IQuerySuccessEventArgs) => this.handleQuerySuccess(args));
    this.bind.onRootElement(QueryEvents.queryError, (args: IQueryErrorEventArgs) => this.handleQueryError(args));

    this.resultLayoutSection = $$(this.element).closest('.coveo-result-layout-section');
  }

  /**
   * Change the current layout.<br/>
   * @param layout The new layout. Available values are `list`, `card` and `table`.
   */
  public changeLayout(layout: string) {
    Assert.check(_.contains(_.keys(this.buttons), layout), 'Layout not available or invalid');
    if (layout !== this.currentLayout) {
      this.bind.trigger(this.root, ResultListEvents.changeLayout, <IChangeLayoutEventArgs>{
        layout: layout
      })
      if (this.currentLayout) {
        $$(this.buttons[this.currentLayout]).removeClass('coveo-selected');
      }
      $$(this.buttons[layout]).addClass('coveo-selected');
      this.currentLayout = layout;
    }
  }

  public handlePopulate(args: IResultLayoutPopulateArgs) {
    this.addButton(args.layout);
  }

  public handleQuerySuccess(args: IQuerySuccessEventArgs) {
    if (args.results.results.length === 0) {
      $$(this.element).addClass('coveo-result-layout-hidden');
      if (this.resultLayoutSection) {
        this.resultLayoutSection.style.display = 'none';
      }
    } else {
      $$(this.element).removeClass('coveo-result-layout-hidden');
      if (this.resultLayoutSection) {
        this.resultLayoutSection.style.display = 'block';
      }
    }
  }

  public handleQueryError(args: IQueryErrorEventArgs) {
    $$(this.element).addClass('coveo-result-layout-hidden');
    if (this.resultLayoutSection) {
      this.resultLayoutSection.style.display = 'none';
    }
  }

  public getCurrentLayout() {
    return this.currentLayout;
  }

  private addButton(layout?: string) {
    Assert.check(_.contains(ResultLayout.validLayouts, layout), 'Invalid layout');
    if (_.keys(this.buttons).length === 0) { // If it's the first layout added, select it as default
      this.bind.oneRootElement(QueryEvents.querySuccess, () => this.changeLayout(layout));
    }
    const btn = $$('span', { className: 'coveo-result-layout-selector' }, layout);
    // TODO: Icon classname temporary
    btn.prepend($$('span', { className: 'coveo-icon coveo-sprites-checkbox-exclusion' }).el);
    if (layout === this.currentLayout) {
      btn.addClass('coveo-selected');
    }
    btn.on('click', () => this.changeLayout(layout));
    $$(this.element).append(btn.el);
    this.buttons[layout] = btn.el;
  }
}

Initialization.registerAutoCreateComponent(ResultLayout);
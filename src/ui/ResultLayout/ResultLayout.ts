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
import {QueryStateModel} from '../../models/QueryStateModel';
import {Model, IAttributesChangedEventArg} from '../../models/Model';

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

    const eventName = this.queryStateModel.getEventName(Model.eventTypes.changeOne) + QueryStateModel.attributesEnum.layout;
    this.bind.onRootElement(eventName, this.handleQueryStateChanged.bind(this));
    this.bind.onRootElement(QueryEvents.querySuccess, (args: IQuerySuccessEventArgs) => this.handleQuerySuccess(args));
    this.bind.onRootElement(QueryEvents.queryError, (args: IQueryErrorEventArgs) => this.handleQueryError(args));

    this.resultLayoutSection = $$(this.element).closest('.coveo-result-layout-section');

    this.populate();
  }

  /**
   * Change the current layout.<br/>
   * @param layout The new layout. Available values are `list`, `card` and `table`.
   */
  public changeLayout(layout: string) {
    Assert.check(_.contains(_.keys(this.buttons), layout), 'Layout not available or invalid');
    if (layout !== this.currentLayout || this.getQsmValue() === '') {
      this.bind.trigger(this.root, ResultListEvents.changeLayout, <IChangeLayoutEventArgs>{
        layout: layout
      })
      if (this.currentLayout) {
        $$(this.buttons[this.currentLayout]).removeClass('coveo-selected');
      }
      $$(this.buttons[layout]).addClass('coveo-selected');
      this.setQsmValue(layout);
      this.currentLayout = layout;
    }

  }

  private handleQuerySuccess(args: IQuerySuccessEventArgs) {
    if (args.results.results.length === 0 || _.isEmpty(this.buttons)) {
      this.hide();
    } else {
      this.show();
    }
  }

  private handleQueryStateChanged(args: IAttributesChangedEventArg) {
    const modelLayout = this.getQsmValue();
    const newLayout = _.find(_.keys(this.buttons), l => l === modelLayout);
    if (newLayout !== undefined) {
      this.changeLayout(newLayout);
    } else {
      this.changeLayout(_.keys(this.buttons)[0]);
    }
  }

  private handleQueryError(args: IQueryErrorEventArgs) {
    this.hide();
  }

  private populate() {
    let populateArgs: IResultLayoutPopulateArgs = { layouts: [] };
    $$(this.root).trigger(ResultLayoutEvents.resultLayoutPopulate, populateArgs);
    if (populateArgs.layouts.length > 1) {
      _.each(populateArgs.layouts, l => this.addButton(l));
    } else {
      this.hide();
    }
  }

  public getCurrentLayout() {
    return this.currentLayout;
  }

  private addButton(layout?: string) {
    Assert.check(_.contains(ResultLayout.validLayouts, layout), 'Invalid layout');
    if (_.keys(this.buttons).length === 0) {
      setTimeout(() => {
        // If the QSM doesn't have any value for layout (doesn't call a state-change), we set the
        // active layout to the first one.
        if (this.getQsmValue() === '') {
          this.bind.oneRootElement(QueryEvents.querySuccess, () => this.changeLayout(layout));
        }
      });
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

  private hide() {
    const elem = this.resultLayoutSection || this.element;
    $$(elem).addClass('coveo-result-layout-hidden');
  }

  private show() {
    const elem = this.resultLayoutSection || this.element;
    $$(elem).removeClass('coveo-result-layout-hidden');
  }

  private getQsmValue(): string {
    return this.queryStateModel.get(QueryStateModel.attributesEnum.layout);
  }

  private setQsmValue(val: string) {
    this.queryStateModel.set(QueryStateModel.attributesEnum.layout, val);
  }
}

Initialization.registerAutoCreateComponent(ResultLayout);
import {Dropdown} from '../Form/Dropdown';
import {TextInput} from '../Form/TextInput';
import {l} from '../../../strings/Strings';
import {$$} from '../../../utils/Dom';
import {DocumentInput} from './DocumentInput';

export class AdvancedFieldInput extends DocumentInput {

  protected element: HTMLElement
  private mode: Dropdown;
  private input: TextInput;

  constructor(public inputName: string, public fieldName: string) {
    super(inputName);
  }

  public build(): HTMLElement {
    let document = $$(super.build());
    this.mode = new Dropdown(['Contains', 'DoesNotContain', 'Matches'], this.inputName)
    document.append(this.mode.getElement());
    this.input = new TextInput();
    document.append(this.input.getElement());
    this.element = document.el;
    return this.element;
  }

  public getValue(): string {
    let inputValue = this.input.getValue();
    if (inputValue) {
      switch (this.mode.getValue()) {
        case 'Contains':
          return this.fieldName + '=' + inputValue;
        case 'DoesNotContain':
          return this.fieldName + '<>' + inputValue;
        default:
          return this.fieldName + '==\"' + inputValue + '\"';
      }
    }
    return '';
  }

}
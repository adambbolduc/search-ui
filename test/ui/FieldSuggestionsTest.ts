import * as Mock from '../MockEnvironment';
import {FieldSuggestions} from '../../src/ui/FieldSuggestions/FieldSuggestions';
import {IFieldSuggestionsOptions} from '../../src/ui/FieldSuggestions/FieldSuggestions';
import {Simulate} from '../Simulate';
import {analyticsActionCauseList} from '../../src/ui/Analytics/AnalyticsActionListMeta';
import {JQuery} from '../JQueryModule';

export function FieldSuggestionsTest() {
  describe('FieldSuggestions', () => {
    let test: Mock.IBasicComponentSetup<FieldSuggestions>;

    beforeEach(() => {
      // In phantom js there is a bug with CustomEvent('click'), which is needed to for those tests.
      // So, use jquery for event in phantom js
      if (Simulate.isPhantomJs()) {
        window['jQuery'] = JQuery;
      }

      test = Mock.optionsComponentSetup<FieldSuggestions, IFieldSuggestionsOptions>(FieldSuggestions, {
        field: '@foobar'
      });

    })

    afterEach(() => {
      test = null;
      window['jQuery'] = null;
    })

    it('should do a request on the endpoint', () => {
      Simulate.omnibox(test.env);
      expect(test.env.searchEndpoint.listFieldValues).toHaveBeenCalledWith(jasmine.objectContaining({
        field: '@foobar'
      }));
    })

    it('should throw when there is no field', () => {
      expect(() => {
        test = Mock.optionsComponentSetup<FieldSuggestions, IFieldSuggestionsOptions>(FieldSuggestions, {
          field: undefined
        });
      }).toThrow()
    })

    it('should trigger an analytics event on suggestion', (done) => {
      test.env.searchEndpoint.listFieldValues = jasmine.createSpy('search');
      (<jasmine.Spy>test.env.searchEndpoint.listFieldValues).and.returnValue(new Promise((resolve) => {
        resolve([{ value: 'foo' }, { value: 'bar' }, { value: 'baz' }])
      }));
      var simulation = Simulate.omnibox(test.env);
      test.cmp.selectSuggestion(0);
      simulation.rows[0].deferred.then((elementResolved) => {
        test.cmp.selectSuggestion(0);
        expect(test.env.usageAnalytics.logSearchEvent).toHaveBeenCalledWith(analyticsActionCauseList.omniboxField, {})
        done();
      })
    })

    describe('exposes options', () => {

      it('queryOverride should be passed in the list field value', () => {
        test = Mock.optionsComponentSetup<FieldSuggestions, IFieldSuggestionsOptions>(FieldSuggestions, {
          field: '@foobar',
          queryOverride: 'some override'
        });
        Simulate.omnibox(test.env);
        expect(test.env.searchEndpoint.listFieldValues).toHaveBeenCalledWith(jasmine.objectContaining({
          field: '@foobar',
          queryOverride: 'some override'
        }));
      })

      it('omniboxZIndex should be taken into account', (done) => {
        test = Mock.optionsComponentSetup<FieldSuggestions, IFieldSuggestionsOptions>(FieldSuggestions, {
          field: '@foobar',
          omniboxZIndex: 333
        });
        test.env.searchEndpoint.listFieldValues = jasmine.createSpy('search');
        (<jasmine.Spy>test.env.searchEndpoint.listFieldValues).and.returnValue(new Promise((resolve) => {
          resolve([{ value: 'foo' }, { value: 'bar' }, { value: 'baz' }])
        }));
        var simulation = Simulate.omnibox(test.env);
        test.cmp.selectSuggestion(0);
        simulation.rows[0].deferred.then((elementResolved) => {
          expect(elementResolved.zIndex).toBe(333);
          done();
        })
      })

      it('numberOfSuggestions should be passed in the list field value', () => {
        test = Mock.optionsComponentSetup<FieldSuggestions, IFieldSuggestionsOptions>(FieldSuggestions, {
          field: '@foobar',
          numberOfSuggestions: 333
        });
        Simulate.omnibox(test.env);
        expect(test.env.searchEndpoint.listFieldValues).toHaveBeenCalledWith(jasmine.objectContaining({
          field: '@foobar',
          maximumNumberOfValues: 333
        }));
      })
    })
  })
}

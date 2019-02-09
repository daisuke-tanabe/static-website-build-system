import $ from 'jquery';
import Text from '../utility/Text';

export default class Form {
  constructor($selector) {
    this.$selector = $selector;
    this.$fields = this.$selector.find('.js-field');
    this.$submit = this.$selector.find('.js-form-submit');
    this.$selector.data({
      fields: Form.addFieldsData(this.$fields.get())
    });

    this.$selector.data('fields').forEach(field => {
      const { $input, $counter, $clear } = field;
      Form.updateCounter($input, $counter);

      if ($clear.length !== 0) {
        $clear.on('click', () => {
          $input.each((index, input) => $(input).prop('checked', false));
        });
      }

      if ($counter.length !== 0) {
        $input.on('input', () => {
          Form.updateCounter($input, $counter);
        });
      }
    });

    this.$submit.on('click', () => {
      const validate = Form.validate(this.$selector.data('fields'));
      return validate.every(result => result);
    });
  }

  static updateCounter($input, $counter) {
    $counter.text(Text.byte($input.val()));
  }

  static addFieldsData(fields) {
    return fields.reduce((result, field) => {
      const $field = $(field);
      const $input = $field.find('.js-field-input');
      const $error = $field.find('.js-field-error');
      const $counter = $field.find('.js-filed-counter');
      const $clear = $field.find('.js-field-clear-button');
      const type = $field.attr('data-type');
      result.push({ $input, $error, $counter, $clear, type });
      return result;
    }, []);
  }

  static validate(fieldsData) {
    return fieldsData.map(field => {
      const { $input, $error, type } = field;

      if (type === 'text' || type === 'textarea') {
        const isError = $input.val() === '';
        $error.toggleClass('is-show', isError);
        return !isError;
      }

      if (type === 'radio' || type === 'checkbox') {
        const domInput = [...Array($input.length)].map(
          (noop, index) => $input[index]
        );
        const isError = !domInput.some(input => input.checked);
        $error.toggleClass('is-show', isError);
        return !isError;
      }

      if (type === 'select') {
        const isError = $input.find('option:selected').val() === '';
        $error.toggleClass('is-show', isError);
        return !isError;
      }

      return false;
    });
  }
}

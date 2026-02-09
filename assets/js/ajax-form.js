(function ($) {
    'use strict';

    const bindContactForm = () => {
        $(document).off('submit.portfolioContact');
        $(document).on('submit.portfolioContact', '.contact-form form', function (e) {
            e.preventDefault();

            const form = $(this);
            const message = form.find('.messenger-box-contact__msg');
            const fullName = form.find('#full-name');
            const email = form.find('#email');

            if (!fullName.val() || !email.val()) {
                fullName.addClass('invalid');
                return false;
            }

            const formData = form.serialize();

            const doneFunc = (response) => {
                message.fadeIn().removeClass('alert-danger').addClass('alert-success');
                message.text(response);
                setTimeout(function () {
                    message.fadeOut();
                }, 3000);
                form.find('input:not([type="submit"]), textarea').val('');
            };

            const failFunc = (data) => {
                message.fadeIn().removeClass('alert-success').addClass('alert-success');
                message.text(data.responseText);
                setTimeout(function () {
                    message.fadeOut();
                }, 3000);
            };

            $.ajax({
                type: 'POST',
                url: form.attr('action'),
                data: formData
            })
                .done(doneFunc)
                .fail(failFunc);
        });
    };

    window.initContactForm = bindContactForm;
    bindContactForm();
})(jQuery);
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

            // Build JSON payload (mailer.php not supported on Cloudflare),
            // POST to the Worker /api/contact endpoint.
            const payload = {
                name: form.find('#full-name').val(),
                email: form.find('#email').val(),
                subject: form.find('#subject').val() || '',
                message: form.find('#message').val() || form.find('textarea').val() || ''
            };

            const doneFunc = (response) => {
                message.fadeIn().removeClass('alert-danger').addClass('alert-success');
                message.text(response && response.message ? response.message : 'Message sent successfully!');
                setTimeout(() => message.fadeOut(), 3000);
                form.find('input:not([type="submit"]), textarea').val('');
            };

            const failFunc = (data) => {
                message.fadeIn().removeClass('alert-success').addClass('alert-danger');
                let msg = 'Something went wrong. Please try again.';
                if (data && data.responseJSON && data.responseJSON.message) msg = data.responseJSON.message;
                message.text(msg);
                setTimeout(() => message.fadeOut(), 3000);
            };

            $.ajax({
                type: 'POST',
                url: '/api/contact',
                contentType: 'application/json',
                data: JSON.stringify(payload)
            })
                .done(doneFunc)
                .fail(failFunc);
        });
    };

    window.initContactForm = bindContactForm;
    bindContactForm();
})(jQuery);
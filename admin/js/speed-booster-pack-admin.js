(function ($) {
    'use strict';

    /**
     * All of the code for your admin-facing JavaScript source
     * should reside in this file.
     *
     * Note: It has been assumed you will write jQuery code here, so the
     * $ function reference has been prepared for usage within the scope
     * of this function.
     *
     * This enables you to define handlers, for when the DOM is ready:
     *
     * $(function() {
     *
     * });
     *
     * When the window is loaded:
     *
     * $( window ).load(function() {
     *
     * });
     *
     * ...and/or other possibilities.
     *
     * Ideally, it is not considered best practise to attach more than a
     * single DOM-ready or window-load handler for a particular page.
     * Although scripts in the WordPress core, Plugins and Themes may be
     * practising this, we should strive to set a better example in our own work.
     */
    $(window).on('load', function () {
        $('span .sbp-cloudflare-test').attr('disabled', 'disabled').css('opacity', '0.6');
    });

    $(document).on('click', '.sbp-cloudflare-test', function (e) {
        e.preventDefault();
        $('.sbp-cloudflare-info-text').hide();
        $('.sbp-cloudflare-test .sbp-cloudflare-spinner').show();
        $(e.target).attr('disabled', 'disabled').css('opacity', '0.6');
        $('.sbp-cloudflare-incorrect, .sbp-cloudflare-correct').hide();

        const api_key = $('[data-depend-id="cloudflare_api"]').val();
        const email = $('[data-depend-id="cloudflare_email"]').val();
        const zone_id = $('[data-depend-id="cloudflare_zone"]').val();

        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {action: "sbp_check_cloudflare", api_key: api_key, email: email, zone_id: zone_id},
            success: function (response) {
                response = JSON.parse(response);
                if (response.status === 'true') {
                    $('.sbp-cloudflare-correct').show();
                } else if (response.status === 'false') {
                    $('.sbp-cloudflare-incorrect').show();
                } else {
                    $('.sbp-cloudflare-connection-issue').show();
                }
            },
            complete: function () {
                $('.sbp-cloudflare-test .sbp-cloudflare-spinner').hide();
                $(e.target).removeAttr('disabled').css('opacity', '1');
            }
        });
    });

    $.changeInputs = function (match, response, parent = null) {
        let value = '';
        const $field = $('[data-depend-id="' + match.field + '"]');
        if (match.type === 'switcher') {
            if (parent !== null) {
                value = response.results[parent].value[match.id] === 'on' ? '1' : '';
            } else {
                value = response.results[match.id].value === 'on' ? '1' : '';
            }
            $field.val(value);
            if (value === '1') {
                $field.parent().addClass('csf--active');
            } else {
                $field.parent().removeClass('csf--active');
            }
        }

        if (match.type === 'text') {
            if (parent === null) {
                value = response.results[match.id].value;
            } else {
                value = response.results[parent].value[match.id];
            }
            $field.val(value);
        }

        if (match.type === 'array') {
            match.matches.map(function (item) {
                $.changeInputs(item, response, match.id);
            });
        }

        $('.with-preloader').removeClass('with-preloader');
    };

    $.checkCloudflareSettings = function () {
        const id_field_matches = [
            {
                id: 'rocket_loader',
                field: 'cf_rocket_loader_enable',
                type: 'switcher',
            },
            {
                id: 'development_mode',
                field: 'cf_dev_mode_enable',
                type: 'switcher',
            },
            {
                id: 'minify',
                type: 'array',
                matches: [
                    {
                        id: 'css',
                        field: 'cf_css_minify_enable',
                        type: 'switcher',
                    },
                    {
                        id: 'html',
                        field: 'cf_html_minify_enable',
                        type: 'switcher',
                    },
                    {
                        id: 'js',
                        field: 'cf_js_minify_enable',
                        type: 'switcher',
                    },
                ]
            },
            {
                id: 'browser_cache_ttl',
                field: 'cf_browser_cache_ttl',
                type: 'text',
            },
            {
                id: 'automatic_platform_optimization',
                field: 'cf_apo_enable',
                type: 'array',
                matches: [
                    {
                        id: 'enable',
                        field: 'cf_apo_enable',
                        type: 'switcher',
                    },
                    {
                        id: 'device_type',
                        field: 'cf_apo_device_type',
                        type: 'switcher',
                    },
                ]
            },
        ];

        $.ajax({
            url: ajaxurl,
            type: 'GET',
            data: {action: 'sbp_get_cloudflare_settings'},
            success: function (response) {
                response = JSON.parse(response);
                if (response.status === 'success') {
                    if (_.size(response.results) > 0) {
                        id_field_matches.map(function (match) {
                            $.changeInputs(match, response);
                        });
                        $('.with-preloader').show();
                    }
                } else if (response.status === 'empty_info') {
                    $('.sbp-cloudflare-warning').show();
                } else {
                    if (response.status === 'null') {
                        $('.sbp-cloudflare-connection-issue').show();
                    } else {
                        $('.sbp-cloudflare-incorrect').show();
                    }
                    $('.with-preloader::before, .with-preloader::after').remove();
                }
            },
            complete: function () {
                $('.sbp-cloudflare-test .sbp-cloudflare-spinner').hide();
                $('.sbp-cloudflare-test').removeAttr('disabled').css('opacity', 1);
                $('.sbp-cloudflare-fetching').remove();
            }
        });
    };

    let hasCloudflareChecked = false;

    // $(document).on('change', '[data-depend-id="cloudflare_enable"]', function () {
    //     $.checkCloudflareSettings();
    //
    //     hasCloudflareChecked = true;
    // });

    $(window).on('hashchange csf.hashchange', function () {

        if (hasCloudflareChecked === false) {
            var hash = window.location.hash.replace('#tab=', '');

            if (hash === 'cdn-proxy') {
                $.checkCloudflareSettings();

                hasCloudflareChecked = true;
            }
        }

    });

    $(document).on('submit', "#sbp-subscribe-newsletter-form", function (e) {
        e.preventDefault();
        var $form = $("#subscribe-newsletter-form");
        var name = $form.find('input[name="first_name"]').val();
        var email = $form.find('input[name="email"]').val();
        var gdpr = $form.find('input[name="gdpr"]').val();
        $('#sbp-newsletter-subscribe-button').attr('disabled', 'disabled').css('text-shadow', 'none');
        $.ajax({
            type: 'POST',
            url: 'https://sendfox.com/form/104ezx/3o64jv',
            data: {first_name: name, email: email, gdpr: gdpr},
            success: function (data, statusText) {
                $('.sbp-newsletter-success').show();
                $('.sbp-subscribe-content-wrapper').hide();
                $('#sbp-subscribe-newsletter-form').parent().parent().find('> p').hide();
                if (statusText === 'success') {
                    $.ajax({
                        type: 'POST',
                        url: ajaxurl,
                        data: {action: 'sbp_hide_newsletter_pointer'}
                    });
                }
            }
        });
    });

    $(document).on('click', '.sbp-scan-database-tables', function() {
        var $button = $(this);
        $button.addClass('sbp-loading-active');
        $button.attr('disabled', 'disabled');

        $.ajax({
            type: 'GET',
            url: ajaxurl,
            data: {'action': 'sbp_database_action', 'sbp_action': 'fetch_non_innodb_tables', 'nonce': sbp_ajax_vars.nonce},
            success: function(response) {
                response = JSON.parse(response);
                var $table = $('.sbp-database-tables');
                var $tableBody = $('.sbp-database-tables tbody');
                $tableBody.html('');
                if (response.tables && response.tables.length > 0) {
                    $table.show();
                    response.tables.map(table => {
                        $tableBody.append('<tr>' +
                            '<td style="vertical-align: middle;">' + table.table_name + '</td>\n' +
                            '<td>' +
                            '<button type="button" class="button button-primary sbp-convert-table sbp-button-loading" data-table-name="' + table.table_name + '"><span>Convert To InnoDB</span> <i class="dashicons dashicons-image-rotate"></i></button>' +
                            '</td>' +
                            '</tr>');
                    });
                } else {
                    $table.show();
                    $tableBody.html('<tr><td colspan="2">No database table found.</td></tr>'); // B_TODO: Check text
                }
            },
            error: function(xhr, status) {
                alert('Error occured while fetching database tables.'); // B_TODO: Check text
            },
            complete: function() {
                $button.removeClass('sbp-loading-active');
                $button.removeAttr('disabled');
            }
        });
    });

    $(document).on('click', '.sbp-convert-table', function() {
        var $button = $(this);
        var table_name = $button.data('table-name');

        $button.addClass('sbp-loading-active');
        $button.attr('disabled', 'disabled');

        $.ajax({
            type: 'GET',
            url: ajaxurl,
            data: {'action': 'sbp_database_action', 'sbp_action': 'convert_tables', 'sbp_convert_table_name': table_name, 'nonce': sbp_ajax_vars.nonce},
            success: function(response) {
                response = JSON.parse(response);
                if (response.status === 'failure') {
                    $button.removeClass('sbp-loading-active');
                    $button.removeAttr('disabled');
                    alert(response.message);
                } else {
                    $button.parent().html('<span style="color: darkgreen;">Converted successfully.</span>'); // B_TODO: Check text
                }
            },
            error: function(xhr, status) {
                alert('Error occurred while fetching database tables.'); // B_TODO: Check text
            },
            complete: function() {
                $button.removeClass('sbp-loading-active');
                $button.removeAttr('disabled');
            }
        });
    });

})(jQuery);
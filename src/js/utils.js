/*
    Function to set a cookie
 */
export function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    var expires = 'expires=' + d.toUTCString();

    if (document.cookie === '') {
        document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
    } else {
        document.cookie =
            document.cookie +
            ';' +
            cname +
            '=' +
            cvalue +
            ';' +
            expires +
            ';path=/';
    }
}

/*
    Function to get a saved cookie
 */
export function getCookie(cname) {
    var name = cname + '=';
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');

    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];

        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }

        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }

    return '';
}

/*
    Function to disable hover rules on touch devices
 */
export function removeTouchHoverCSSRule() {
    if ('createTouch' in document) {
        try {
            var ignore = /:hover/;

            for (var i = 0; i < document.styleSheets.length; i++) {
                var sheet = document.styleSheets[i];

                if (!sheet.cssRules) {
                    continue;
                }

                for (var j = sheet.cssRules.length - 1; j >= 0; j--) {
                    var rule = sheet.cssRules[j];

                    if (
                        rule.type === CSSRule.STYLE_RULE &&
                        ignore.test(rule.selectorText)
                    ) {
                        sheet.deleteRule(j);
                    }
                }
            }
        } catch (error) {
            console.error(error);
        }
    }
}

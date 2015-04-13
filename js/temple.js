/**
 * Created by Scott on 4/9/2015.
 */
define(function() {
    var html2Dom = function(html) {
        var container = document.createElement('div');

        container.innerHTML = html;

        return container.firstChild;
    };

    return function(html, dataMap, toDom) {
        var re = /{{([^}]+)}}/mig;

        html = html.replace(re, function() {
            return dataMap[RegExp.$1];
        });

        return toDom ? html2Dom(html) : html;
    }
});
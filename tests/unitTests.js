/**
 * Created by Scott on 2/25/2015.
 */
define(['testharness', '../js/request', '../js/temple', '../js/notify'], function(testharness, request, temple, notify) {
    var xhrTest = testharness.async_test("Testing XHR API"),
        dataTest = testharness.async_test("Testing JSON Response Data"),
        uriArgsTest = testharness.async_test("Testing URI Passed Arguments"),
        textImportTest = testharness.async_test("Testing Text Response Data"),
        templateTest = testharness.async_test("Testing Template Engine"),
        tests = {};

    tests.run = function() {

        request('../json/topic_01.json').then(function(xhr) {
            if (xhr.readyState === 4) {
                // Testing xhr connectivity
                xhrTest.step(function () {
                    testharness.assert_equals(xhr.status, 200, 'XHR Response');
                });

                xhrTest.done();

                // testing response data
                dataTest.step(function() {
                    var response = xhr.response,
                        obj = JSON.parse(response);

                    // Did we get a discussion property?
                    testharness.assert_own_property(obj, 'discussion', 'JSON Response contains discussion');
                });

                dataTest.done();
            }
        }).catch(function(err) {
            // Edge-cases
            console.log("XHR testing failed!", err);
            xhrTest.done();
            dataTest.done();
        });

        request(encodeURI('../json/topic_01.json?id=1&title=Topic Title')).then(function(xhr) {
            // Did we get the arguments back?
            uriArgsTest.step(function () {
                testharness.assert_object_equals(xhr.uriArgs, {id: '1', title: 'Topic Title'}, 'Request returns URI arguments');
            });

            uriArgsTest.done();
        }).catch(function(err) {
            // Edge-cases
            console.log("URI Argument testing failed!", err);
            uriArgsTest.done();
        });

        request('template.html').then(function(xhr) {
            textImportTest.step(function () {
                var str = "<div>{{language}}</div>";

                testharness.assert_equals(xhr.response, str, 'XHR Text Response contains a string');
            });

            textImportTest.done();
        }).catch(function(err) {
            // Edge-cases
            console.log("Text import testing failed!", err);
            textImportTest.done();
        });

        request('template.html').then(function(xhr) {
            templateTest.step(function () {
                var htmlStr = xhr.response,
                    dataMap = {
                        "language": "JavaScript"
                    },
                    html = temple(htmlStr, dataMap, true);

                testharness.assert_equals(html.childNodes[0].textContent, 'JavaScript', 'Template contains DOM and replacement text');
            });

            templateTest.done();
        }).catch(function(err) {
            // Edge-cases
            console.log("Text import testing failed!", err);
            templateTest.done();
        });

        testharness.test(function() {
            var n = 0,
                testSubscriber = notify.subscribe('testing', {
                "callBack": function() {
                    n += 1;
                },
                "context": {}
            });

            notify.publish('testing');

            testharness.assert_equals(n, 1, 'Topic was published and callback fired');

            notify.unsubscribe('testing', testSubscriber);

            n = 0;

            notify.publish('testing');

            testharness.assert_equals(n, 0, 'Topic was unsubscribed');

        }, "Testing Publish Subscribe API");

    };

    return tests;

});
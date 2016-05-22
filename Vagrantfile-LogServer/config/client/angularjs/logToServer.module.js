﻿(function () {
    'use strict'

    // Create new module logToServer with new $log service
     angular.module('logToServer', [])
        // Make AngularJS do JavaScript logging through JSNLog so we can log to the server by replacing the $log service
        .service('$log', function () {
            this.log = function (msg) {
                JL('Angular').trace(msg);
            }
            this.debug = function (msg) {
                JL('Angular').debug(msg);
            }
            this.info = function (msg) {
                JL('Angular').info(msg);
            }
            this.warn = function (msg) {
                JL('Angular').warn(msg);
            }
            this.error = function (msg) {
                JL('Angular').error(msg);
            }

            JL.setOptions({
                'defaultAjaxUrl': 'http://logger.cirrus.io:9997/jsnlog.logger',
                'requestId': window.location.pathname.split("/").pop()
            })
        })
        // Replace the factory that creates the standard $exceptionHandler service
        .factory('$exceptionHandler', function () {
            return function (exception, cause) {
                JL().log(4000, { 'stack': exception.stack, 'error': exception.message });
                throw exception;
            };
        })
        // Add a factory to create the interceptor to the logToServer module
        .factory('logToServerInterceptor', ['$q', function ($q) {
            var myInterceptor = {
                // The request function is called before the AJAX request is sent
                'request': function (config) {
                    config.msBeforeAjaxCall = new Date().getTime();
                    return config;
                },
                // The response function is called after receiving a good response from the server
                'response': function (response) {
                    var msAfterAjaxCall = new Date().getTime();
                    var timeTakenInMs = msAfterAjaxCall - response.config.msBeforeAjaxCall;
                    JL('Angular.Ajax').info({
                        url: response.config.url,
                        timeTakenInMs: timeTakenInMs
                    });
                    return response;
                },
                // The responseError function is called when an error response was received, or when a timeout happened.
                'responseError': function (rejection) {
                    var errorMessage = "unknown";
                    JL('Angular.Ajax').fatalException({
                        status: rejection.status,
                        url: rejection.config.url,
                        errorMessage: rejection.data.error
                    });
                    return $q.reject(rejection);
                }
            };
            return myInterceptor;
        }]);

})();

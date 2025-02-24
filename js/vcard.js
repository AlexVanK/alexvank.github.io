/* Angular Initializer for the VCard Website */

'use strict';

angular.module('nameApp', ['ui.router', 'ngResource', 'ngAnimate', 'SmoothScrollbar'])
    .config(function($stateProvider, $urlRouterProvider) {

    $stateProvider

    // route for the home page (should be the vcard on the profile section)
        .state('vcard', {
        url:'/vcard',
        abstract: true,
        views: {
            'main': {
                templateUrl : 'views/vcard.html'
            }
        }
    })

    // route for the profile section
        .state('vcard.profile', {
        url:'/profile',
        views: {
            'content': {
                templateUrl : 'views/profile.html'
            }
        }
    })

    // route for the resume section
        .state('vcard.resume', {
        url:'/resume',
        views: {
            'content': {
                templateUrl : 'views/resume.html'
            }
        }
    })

    // route for the portfolio section
        .state('vcard.portfolio', {
        url: '/portfolio',
        views: {
            'content': {
                templateUrl : 'views/portfolio.html'
            }
        }
    })

    // route for the blog section


    // route for the contacts section
        .state('vcard.contacts', {
        url: '/contacts',
        views: {
            'content': {
                templateUrl : 'views/contacts.html',
            }
        }
    })

    $urlRouterProvider.when('','/vcard');
    $urlRouterProvider.when('/vcard','/vcard/profile?lol=ciao');
})

;

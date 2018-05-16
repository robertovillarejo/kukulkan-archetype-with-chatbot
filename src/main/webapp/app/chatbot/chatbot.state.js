(function () {
    'use strict';

    angular
        .module('jpaApp')
        .config(stateConfig);

    stateConfig.$inject = ['$stateProvider'];

    function stateConfig($stateProvider) {
        $stateProvider.state('chatbot', {
            parent: 'admin',
            url: '/chatbot',
            data: {
                authorities: ['ROLE_ADMIN'],
                pageTitle: 'health.title'
            },
            views: {
                'content@': {
                    templateUrl: 'app/chatbot/chatbot.html',
                    controller: 'ChatbotController',
                    controllerAs: 'vm'
                }
            },
            resolve: {
                translatePartialLoader: ['$translate', '$translatePartialLoader', function ($translate, $translatePartialLoader) {
                    $translatePartialLoader.addPart('health');
                    return $translate.refresh();
                }]
            }
        });
    }
})();

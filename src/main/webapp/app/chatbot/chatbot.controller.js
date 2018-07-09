(function () {
    'use strict';

    angular
        .module('jpaApp')
        .controller('ChatbotController', ChatbotController);

    ChatbotController.$inject = ['ChatbotService', '$rootScope', '$scope'];

    function ChatbotController(ChatbotService, $rootScope, $scope) {

        ChatbotService.connect();

        var vm = this;
        vm.connected = false;
        vm.messages = [];
        vm.typing = false;
        vm.messageOutgoing = getOutgoingMessage();
        vm.active = false;

        vm.toggleWindow = function () {
            vm.active = !vm.active;
        }

        vm.send = function () {
            if (vm.messageOutgoing.text) {
                ChatbotService.send(vm.messageOutgoing.text);
                vm.messageOutgoing['sent_timestamp'] = Date.now();
                vm.messages.push(vm.messageOutgoing);
                vm.messageOutgoing = getOutgoingMessage();
                autoScroll();
            }
        }

        $rootScope.$on('chatbot.disconnected', function () {
            $scope.$apply(function () {
                vm.connected = false;
            });
        });

        $rootScope.$on('chatbot.connected', function () {
            $scope.$apply(function () {
                vm.connected = true;
            });
        });

        $rootScope.$on('chatbot.message', function (event, message) {
            $scope.$apply(function () {
                vm.messages.push(message);
                vm.typing = false;
                vm.active = true;
                autoScroll();
            });
        });

        $rootScope.$on('chatbot.typing', function (event, message) {
            $scope.$apply(function () {
                vm.typing = true;
            });
        });

        function getOutgoingMessage() {
            return {
                type: 'outgoing',
                text: null
            }
        }

        function autoScroll() {
            var messagesSection = angular.element('.chat-section');
            var scrollPosition = messagesSection.scrollTop();
            messagesSection.stop().animate({ scrollTop: scrollPosition + 1000 }, 500, 'swing');
        }
    }

})();

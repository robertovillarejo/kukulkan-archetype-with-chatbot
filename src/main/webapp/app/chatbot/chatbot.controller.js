(function () {
    'use strict';

    angular
        .module('jpaApp')
        .controller('ChatbotController', ChatbotController);

    ChatbotController.$inject = ['ChatbotService', '$rootScope', '$translate', '$translatePartialLoader'];

    function ChatbotController(ChatbotService, $rootScope, $translate, $translatePartialLoader) {

        $translatePartialLoader.addPart('chatbot');
        $translate.refresh();

        ChatbotService.connect();

        var vm = this;
        vm.connected = false;
        vm.messages = [];
        vm.typing = false;
        vm.inputText;
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
            }
        }

        $rootScope.$on('chatbot.disconnected', function () {
            console.log('Chatbot disconnected');
            vm.connected = false;
        });

        $rootScope.$on('chatbot.connected', function () {
            console.log('Chatbot connected');
            vm.connected = true;
        });

        $rootScope.$on('chatbot.message', function (event, message) {
            console.log(message);
            vm.messages.push(message);
            vm.typing = false;
        });

        $rootScope.$on('chatbot.typing', function (event, message) {
            console.log("Typing...");
            vm.typing = true;
        });

        function getOutgoingMessage() {
            return {
                type: 'outgoing',
                text: null
            }
        }
    }

})();

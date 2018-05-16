(function () {
    'use strict';

    angular
        .module('jpaApp')
        .controller('ChatbotController', ChatbotController);

    ChatbotController.$inject = ['ChatbotService', '$rootScope'];

    function ChatbotController(ChatbotService, $rootScope) {
        var vm = this;
        vm.connected = false;
        vm.messages = [];
        vm.typing = false;
        vm.inputText;
        vm.messageOutgoing = getOutgoingMessage();

        vm.send = function (msg, event) {
            if (msg.text) {
                ChatbotService.send(msg.text, event);
                msg['sent_timestamp'] = new Date();
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

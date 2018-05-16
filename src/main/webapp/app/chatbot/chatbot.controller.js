(function () {
    'use strict';

    angular
        .module('jpaApp')
        .controller('ChatbotController', ChatbotController);

    ChatbotController.$inject = ['ChatbotService'];

    function ChatbotController(ChatbotService) {
        var vm = this;
        
        vm.send = function (text, event) {
            ChatbotService.send(text, event);
        }
    }

})();

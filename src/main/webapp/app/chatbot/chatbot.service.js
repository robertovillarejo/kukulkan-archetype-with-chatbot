(function () {
    'use strict';

    angular
        .module('jpaApp')
        .factory('ChatbotService', ChatbotService);

    ChatbotService.$inject = ['$rootScope', 'CHATBOT_URL', 'Principal'];

    function ChatbotService($rootScope, CHATBOT_URL, Principal) {

        var socket = null;
        var ws_url = CHATBOT_URL;
        var reconnect_timeout = 3000;
        var max_reconnect = 5;
        var reconnect_count = 0;

        var service = {
            send: send,
            connect: connect
        }

        function send(text) {
            if (!text) {
                return;
            }

            Principal.identity().then(function (account) {
                deliverMessage({
                    type: 'message',
                    text: text,
                    user: account.email,
                    channel: 'socket'
                });
            });

            return false;
        }

        function deliverMessage(message) {
            socket.send(JSON.stringify(message));
        }

        function connect() {
            // Create WebSocket connection.
            socket = new WebSocket(ws_url);

            var connectEvent = 'hello';
            // Connection opened
            socket.addEventListener('open', function (event) {
                $rootScope.$emit('chatbot.connected');
                reconnect_count = 0;
                Principal.identity().then(function (account) {
                    deliverMessage({
                        type: connectEvent,
                        user: account.email,
                        channel: 'socket'
                    });
                });
            });

            socket.addEventListener('error', function (event) {
                $rootScope.$emit('chatbot.error');
            });

            socket.addEventListener('close', function (event) {
                $rootScope.$emit('chatbot.disconnected');
                if (reconnect_count < max_reconnect) {
                    setTimeout(function () {
                        connectWebsocket(ws_url);
                    }, reconnect_timeout);
                } else {
                    $rootScope.$emit('chatbot.offline');
                }
            });

            // Listen for messages
            socket.addEventListener('message', function (event) {
                var message = null;
                try {
                    message = JSON.parse(event.data);
                } catch (err) {
                    return;
                }
                if (message.type === 'typing') {
                    $rootScope.$emit('chatbot.typing');
                } else {
                    message['type'] = 'incoming';
                    $rootScope.$emit('chatbot.message', message);
                }
            });
        };
        return service;
    }

})();

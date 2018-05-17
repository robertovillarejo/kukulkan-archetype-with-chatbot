(function () {
    'use strict';

    angular
        .module('jpaApp')
        .factory('ChatbotService', ChatbotService);

    ChatbotService.$inject = ['$rootScope', 'CHATBOT_URL'];

    function ChatbotService($rootScope, CHATBOT_URL) {

        var socket = null;
        var config = {
            ws_url: (location.protocol === 'https:' ? 'wss' : 'ws') + '://' + CHATBOT_URL,
            reconnect_timeout: 3000,
            max_reconnect: 5
        };

        var options = {
            sound: false,
            use_sockets: true
        };

        var reconnect_count = 0;
        var current_user = null;

        var service = {
            send: send
        }

        connect();

        function send(text, e) {
            if (e) e.preventDefault();
            if (!text) {
                return;
            }
            var message = {
                type: 'outgoing',
                text: text
            };

            deliverMessage({
                type: 'message',
                text: text,
                user: null,
                channel: options.use_sockets ? 'socket' : 'webhook'
            });

            return false;
        }

        function deliverMessage(message) {
            if (options.use_sockets) {
                socket.send(JSON.stringify(message));
            } else {
                webhook(message);
            }
        }

        function webhook(message) {
            request('/botkit/receive', message).then(function (message) {
                $rootScope.$emit('chatbot.message', message);
            }).catch(function (err) {
                $rootScope.$emit('chatbot.webhookError', err);
            });

        }

        function request(url, body) {
            return new Promise(function (resolve, reject) {
                var xmlhttp = new XMLHttpRequest();

                xmlhttp.onreadystatechange = function () {
                    if (xmlhttp.readyState == XMLHttpRequest.DONE) {
                        if (xmlhttp.status == 200) {
                            var response = xmlhttp.responseText;
                            var message = null;
                            try {
                                message = JSON.parse(response);
                            } catch (err) {
                                reject(err);
                                return;
                            }
                            resolve(message);
                        } else {
                            reject(new Error('status_' + xmlhttp.status));
                        }
                    }
                };

                xmlhttp.open("POST", url, true);
                xmlhttp.setRequestHeader("Content-Type", "application/json");
                xmlhttp.send(JSON.stringify(body));
            });

        }

        function connect() {
            if (options.use_sockets) {
                connectWebsocket(config.ws_url);
            } else {
                connectWebhook();
            }
        };

        function connectWebhook() {
            // connect immediately
            $rootScope.$emit('chatbot.connected');
            webhook({
                type: connectEvent,
                user: null,
                channel: 'webhook',
            });

        };

        function connectWebsocket(ws_url) {
            // Create WebSocket connection.
            socket = new WebSocket(ws_url);

            var connectEvent = 'hello';
            // Connection opened
            socket.addEventListener('open', function (event) {
                console.log('CONNECTED TO SOCKET');
                $rootScope.$emit('chatbot.connected');
                reconnect_count = 0;
                deliverMessage({
                    type: connectEvent,
                    user: null,
                    channel: 'socket',
                    user_profile: current_user ? current_user : null,
                });
            });

            socket.addEventListener('error', function (event) {
                console.error('ERROR', event);
            });

            socket.addEventListener('close', function (event) {
                console.log('SOCKET CLOSED!');
                $rootScope.$emit('chatbot.disconnected');
                if (reconnect_count < config.max_reconnect) {
                    setTimeout(function () {
                        console.log('RECONNECTING ATTEMPT ', ++reconnect_count);
                        connectWebsocket(config.ws_url);
                    }, config.reconnect_timeout);
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
                    r('socket_error', err);
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

(function () {
    'use strict';

    angular
        .module('jpaApp')
        .factory('ChatbotService', ChatbotService);

    ChatbotService.$inject = ['$showdown'];

    function ChatbotService($showdown) {

        var config = {
            ws_url: (location.protocol === 'https:' ? 'wss' : 'ws') + '://localhost:8090',
            reconnect_timeout: 3000,
            max_reconnect: 5
        };

        var options = {
            sound: false,
            use_sockets: true
        };

        var reconnect_count = 0;
        var guid = null;
        var current_user = null;

        var service = {
            send: send
        }

        var socket;
        var webhook;

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
                user: guid,
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
                trigger(message.type, message);
            }).catch(function (err) {
                trigger('webhook_error', err);
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

        function trigger(event, details) {
            var event = new CustomEvent(event, {
                detail: details
            });
            message_window.dispatchEvent(event);
        }

        function connect(user) {

            connectWebsocket(config.ws_url);
            /*
                        if (user && user.id) {
                            Botkit.setCookie('botkit_guid', user.id, 1);
            
                            user.timezone_offset = new Date().getTimezoneOffset();
                            current_user = user;
                            console.log('CONNECT WITH USER', user);
                        }
            
                        // connect to the chat server!
                        if (options.use_sockets) {
                            connectWebsocket(config.ws_url);
                        } else {
                            connectWebhook();
                        }
            */
        };

        function connectWebhook() {
            if (Botkit.getCookie('botkit_guid')) {
                guid = Botkit.getCookie('botkit_guid');
                connectEvent = 'welcome_back';
            } else {
                guid = generate_guid();
                Botkit.setCookie('botkit_guid', guid, 1);
            }

            // connect immediately
            trigger('connected', {});
            webhook({
                type: connectEvent,
                user: guid,
                channel: 'webhook',
            });

        };

        function connectWebsocket(ws_url) {
            // Create WebSocket connection.
            socket = new WebSocket(ws_url);

            var connectEvent = 'hello';/*
            if (Botkit.getCookie('botkit_guid')) {
                guid = Botkit.getCookie('botkit_guid');
                connectEvent = 'welcome_back';
            } else {
                guid = generate_guid();
                Botkit.setCookie('botkit_guid', guid, 1);
            }*/

            // Connection opened
            socket.addEventListener('open', function (event) {
                console.log('CONNECTED TO SOCKET');
                reconnect_count = 0;
                trigger('connected', event);
                deliverMessage({
                    type: connectEvent,
                    user: guid,
                    channel: 'socket',
                    user_profile: current_user ? current_user : null,
                });
            });

            socket.addEventListener('error', function (event) {
                console.error('ERROR', event);
            });

            socket.addEventListener('close', function (event) {
                console.log('SOCKET CLOSED!');
                trigger('disconnected', event);
                if (reconnect_count < config.max_reconnect) {
                    setTimeout(function () {
                        console.log('RECONNECTING ATTEMPT ', ++reconnect_count);
                        connectWebsocket(config.ws_url);
                    }, config.reconnect_timeout);
                } else {
                    message_window.className = 'offline';
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

                trigger(message.type, message);
            });
        };
        return service;
    }

})();

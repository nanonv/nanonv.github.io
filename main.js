var data = {}
data.nodes = new vis.DataSet()
data.edges = new vis.DataSet()
var network

async function message_handler(message) {
    if (!network) {
        createChart()
    }
    
    let rep = message.block.representative
    if (data.nodes.get(rep) == null) {
        let alias = await getRepresentativeAlias(rep)
        if (alias) {
            data.nodes.add({id: rep, label: alias})
        }
    }

    if (data.nodes.get(message.account) == null) {
        data.nodes.add({id: message.account, color: 'lime'})
    }
    data.edges.add({from: message.account, to: rep})
    
    if (data.nodes.get(message.block.link_as_account) == null) {
        data.nodes.add({id: message.block.link_as_account, color: 'lime'})
    }
    data.edges.add({from: rep, to: message.block.link_as_account})
}

function new_websocket(url, ready_callback, message_callback) {
    let socket = new WebSocket(url);
    socket.onopen = function() {
        console.log('WebSocket is now open');
        if (ready_callback !== undefined) ready_callback(this);
    }
    socket.onerror = function(e) {
        console.error('WebSocket error');
        console.error(e);
    }
    socket.onmessage = function(response) {
        //console.log('New message from: '+ url);
        // console.log(response);
        if (message_callback !== undefined) message_callback(response);
    }

    return socket;
}

function subscribe() {
    new_websocket('wss://ws.mynano.ninja/', function(socket) {
        // onopen
        let params = {
            action: 'subscribe',
            topic: 'confirmation',
            ack: true
        }
        socket.send(JSON.stringify(params));
        }, function(response) {
        // onmessage
        let data = JSON.parse(response.data);
        if (data.topic != 'confirmation') return;	// discard ack
        let message = data.message;
        message_handler(message);
    });
}

function createChart() {
    // create a network
    var container = document.getElementById('container');
    var options = {};
    network = new vis.Network(container, data, options);
}

async function getRepresentativeAlias(rep) {
    const response = await fetch("https://mynano.ninja/api/accounts/"+rep)
    const resp = await response.json()
    return resp.alias
}

subscribe()
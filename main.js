var network
var data = {}
data.nodes = new vis.DataSet()
data.edges = new vis.DataSet()

async function message_handler(message) {
    if (!network) {
        createNetwork()
    }
    
    const rep = message.block.representative
    const sender = message.account
    const receiver = message.block.link_as_account
    var amount = raw_to_nano(message.amount)

    if (data.nodes.get(rep) == null) {
        data.nodes.add({id: rep, label: ''})
        getRepresentativeAliasAndUpdateNode(rep)
    }

    node = data.nodes.get(sender)
    if (!node) {
        let node = {
            id: sender,
            size: getSizeFromAmount(amount)
        }
        data.nodes.add(node)
        getNatriconAndUpdateNode(node)
    }
    data.edges.add({from: sender, to: rep})
    
    node = data.nodes.get(receiver)
    if (!node) {
        let node = {
            id: receiver,
            size: getSizeFromAmount(amount)
        }
        data.nodes.add(node)
        getNatriconAndUpdateNode(node)
    }
    data.edges.add({
        from: rep,
        to: receiver,
    })
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

function createNetwork() {
    // create a network
    var container = document.getElementById('container');
    var options = {
        /*interaction: {
            dragView: false,
            zoomView: false
        }*/
    };
    network = new vis.Network(container, data, options);
    /*setInterval(function(){ 
        network.fit({
            animation: {
                duration: 0
            }
        }) 
    }, 3000);*/

    network.on("selectNode",function(params) {
        console.log(params)
        window.open('https://nanocrawler.cc/explorer/account/'+params.nodes[0]+'/history', '_blank');
    });
}

async function getRepresentativeAliasAndUpdateNode(rep) {
    const response = await fetch("https://mynano.ninja/api/accounts/"+rep)
    const resp = await response.json()
    var node = data.nodes.get(rep)
    node.label = resp.alias
    data.nodes.update(node)
}

async function getNatriconAndUpdateNode(node) {
    const response = await fetch("https://natricon.com/api/v1/nano?address="+node.id)
    const resp = await response.text()
    const img = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(resp)
    node.shape = 'image'
    node.image = img
    data.nodes.update(node)
}

function raw_to_nano(raw) {
	return NanoCurrency.convert(raw, {
        from: 'raw',
        to: 'Nano',
    });
}

function getSizeFromAmount(amount) {
    if (amount < 25) 
        return 25
    return Math.log10(amount) * 25
}

subscribe()
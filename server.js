var mongo = require('mongodb').MongoClient,
    client = require('socket.io').listen(5555).sockets;

mongo.connect('mongodb://' + $OPENSHIFT_MONGODB_DB_HOST + ':' + $OPENSHIFT_MONGODB_DB_PORT + '/ryan', function(err, db)
{
    if (err) throw err;

    client.on('connection', function(socket)
    {

        var col = db.collection('messages'),
            sendStatus = function(s) 
            {
                socket.emit('status', s);
            };

        //  Emit all messages
        col.find().limit(50).sort({_id: 1}).toArray(function(err, res) 
        {
            if (err) throw err;
            socket.emit('output', res);
        });

        //  Wait for input
        socket.on('input', function(data)
        {
            var name = data.name,
                message = data.message,
                whitespacePattern = /^\s*$/;

            if (whitespacePattern.test(name) || whitespacePattern.test(message))
            {
                sendStatus('Name and message is required.');
            }
            else 
            {
                col.insert({name: name, message: message}, function()
                {
                    //  Emit latest message to all clients
                    client.emit('output', [data]);

                    sendStatus({
                        message: "Message sent",
                        clear: true
                    });
                });
            }
        });
    });
});
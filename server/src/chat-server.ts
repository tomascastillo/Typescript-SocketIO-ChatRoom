import { createServer, Server } from 'http';
import * as express from 'express';
import * as socketIo from 'socket.io';

import { Message } from './model';

export class ChatServer {
    public static readonly PORT:number = 8080;
    private app: express.Application;
    private server: Server;
    private io: SocketIO.Server;
    private port: string | number;
    private clientToRooms: Array<String>;
    private uuidv4 = require('uuid/v4');
    private connectedUsers = new Array();


    constructor() {
        this.createApp();
        this.config();
        this.createServer();
        this.sockets();
        this.listen();
    }

    private createApp(): void {
        this.app = express();
    }

    private createServer(): void {
        this.server = createServer(this.app);
    }

    private config(): void {
        this.port = process.env.PORT || ChatServer.PORT;
    }

    private sockets(): void {
        this.io = socketIo(this.server);
    }
    private newId(): number{
        return this.connectedUsers.length+1;
    }
    private listen(): void {
        this.server.listen(this.port, () => {
            console.log('Running server on port %s', this.port);
        });
        this.io.on('register', function(clientUuid){ // a client requests registration
            var id = clientUuid == null? this.newId() : clientUuid; // create an id if client doesn't already have one
            var nsp;
            var ns = "/" + id;
      
            this.io.join(id);
            var nsp = this.app.io.of(ns); // create a room using this id that is only for this client
            this.clientToRooms[ns] = nsp; // save it to a dictionary for future use
            console.log('id: %d'+id);
            // set up what to do on connection
            nsp.on('connection', function(nsSocket){
                console.log('Connected client on port %s.', this.port);
      
                this.connectedUsers[id]=nsSocket;
              nsSocket.on('message', (m: Message) => {
                console.log('id: %d'+id);

                console.log('[server](message): %s', JSON.stringify(m));
                m.uuid=id;
                this.connectedUsers[id].emit('message', m);
                //this.io.emit('message', m);
            });
            nsSocket.on('disconnect', () => {
                console.log('Client disconnected');
            });
        });
    });
       
    }

    public getApp(): express.Application {
        return this.app;
    }
}

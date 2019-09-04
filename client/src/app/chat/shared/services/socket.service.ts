import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { Observer } from "rxjs/Observer";
import { Message } from "../model/message";
import { Event } from "../model/event";

import * as socketIo from "socket.io-client";

const SERVER_URL = "http://localhost:8080";

@Injectable()
export class SocketService {
  public uuid;
  private uuidSocket;

  private socket;

  public initSocket(): void {
    this.socket = socketIo(SERVER_URL);
  }

  public send(message: Message): void {
    this.socket.emit("message", message);
  }

  public register(): void {
    this.socket.on("register", function(data) {
      if (this.uuid == undefined || this.uuidSocket == undefined) {
        // first time we get id from server
        //save id to a variable
        this.uuid = data.uuid;

        // save to localstorage for further usage (optional - only if you want one client per browser e.g.)
        localStorage.setItem("socketUUID", data.uuid);

        this.uuidSocket = io(SERVER_URL + "/" + this.uuid); // set up the room --> will trigger nsp.on('connect',... ) on the server


        this.socket.emit("register", this.uuid);
      }
    });
  }

  public onMessage(): Observable<Message> {
    return new Observable<Message>(observer => {
      this.socket.on("message", (data: Message) => {
       if(data.uuid==this.uuid){
         observer.next(data)
        }
      });
    });
  }

  public onEvent(event: Event): Observable<any> {
    return new Observable<Event>(observer => {
      this.socket.on(event, () => observer.next());
    });
  }
}

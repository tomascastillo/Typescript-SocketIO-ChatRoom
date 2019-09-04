import {
  Component,
  OnInit,
  ViewChildren,
  ViewChild,
  AfterViewInit,
  QueryList,
  ElementRef
} from "@angular/core";
import {
  MatDialog,
  MatDialogRef,
  MatList,
  MatListItem
} from "@angular/material";

import { Action } from "./shared/model/action";
import { Event } from "./shared/model/event";
import { Message } from "./shared/model/message";
import { User } from "./shared/model/user";
import { SocketService } from "./shared/services/socket.service";
import { DialogUserComponent } from "./dialog-user/dialog-user.component";
import { DialogUserType } from "./dialog-user/dialog-user-type";
import { HttpModule, RequestOptions } from "@angular/http";
import { Http } from "@angular/http";
import { HttpHeaders, HttpClient } from "@angular/common/http";

const AVATAR_URL = "../../assets";

@Component({
  selector: "tcc-chat",
  templateUrl: "./chat.component.html",
  styleUrls: ["./chat.component.css"]
})
export class ChatComponent implements OnInit, AfterViewInit {
  vecMensajes: Message[] = [];
  instancia: string;
  action = Action;
  user: User;
  orquestador: User;
  messages: Message[] = [];
  messageContent: string;
  ioConnection: any;
  dialogRef: MatDialogRef<DialogUserComponent> | null;
  defaultDialogUserParams: any = {
    disableClose: true,
    data: {
      title: "Bienvenido!",
      dialogType: DialogUserType.NEW
    }
  };

  // getting a reference to the overall list, which is the parent container of the list items
  @ViewChild(MatList, { read: ElementRef }) matList: ElementRef;

  // getting a reference to the items/messages within the list
  @ViewChildren(MatListItem, { read: ElementRef }) matListItems: QueryList<
    MatListItem
  >;

  constructor(
    private socketService: SocketService,
    public dialog: MatDialog,
    private http: Http,
    private httpclient: HttpClient
  ) {}

  ngOnInit(): void {
    this.http.get("http://localhost:54549/api/NewInstance").subscribe(data => {
      data.json();
      console.log(data);
      console.log(data.json().id);
      this.instancia = data.json().id;
      //this.childTwo.dataShared=id;

      // the console.log(...) line prevents your code from working
      // either remove it or add the line below (return ...)
    });
    this.initModel();
    // Using timeout due to https://github.com/angular/angular/issues/14748
    setTimeout(() => {
      this.openUserPopup(this.defaultDialogUserParams);
    }, 0);
  }

  ngAfterViewInit(): void {
    // subscribing to any changes in the list of items / messages
    this.matListItems.changes.subscribe(elements => {
      this.scrollToBottom();
    });
  }

  // auto-scroll fix: inspired by this stack overflow post
  // https://stackoverflow.com/questions/35232731/angular2-scroll-to-bottom-chat-style
  private scrollToBottom(): void {
    try {
      this.matList.nativeElement.scrollTop = this.matList.nativeElement.scrollHeight;
    } catch (err) {}
  }

  private initModel(): void {
    const randomId = this.getRandomId();
    this.user = {
      id: 1,
      avatar: `${AVATAR_URL}/user.png`
    };
    this.orquestador = {
      id: 2,
      name: "Asistente virtual de Whirlpool",
      avatar: `${AVATAR_URL}/whirlpool.png`
    };
  }

  private initIoConnection(): void {
    this.socketService.initSocket();

    this.ioConnection = this.socketService
      .onMessage()
      .subscribe((message: Message) => {
        this.messages.push(message);
      });

    this.socketService.onEvent(Event.CONNECT).subscribe(() => {
      console.log("connected");
    });

    this.socketService.register();

    this.socketService.onEvent(Event.DISCONNECT).subscribe(() => {
      console.log("disconnected");
    });
  }

  private getRandomId(): number {
    return Math.floor(Math.random() * 1000000) + 1;
  }

  public onClickUserInfo() {
    this.openUserPopup({
      data: {
        username: this.user.name,
        title: "Edit Details",
        dialogType: DialogUserType.EDIT
      }
    });
  }

  private openUserPopup(params): void {
    this.dialogRef = this.dialog.open(DialogUserComponent, params);
    this.dialogRef.afterClosed().subscribe(paramsDialog => {
      if (!paramsDialog) {
        return;
      }

      this.user.name = paramsDialog.username;
      if (paramsDialog.dialogType === DialogUserType.NEW) {
        this.initIoConnection();
        this.sendNotification(paramsDialog, Action.JOINED);
      } else if (paramsDialog.dialogType === DialogUserType.EDIT) {
        this.sendNotification(paramsDialog, Action.RENAME);
      }
    });
  }

  public sendMessage(message: string): void {
    if (!message) {
      return;
    }
    console.log(      localStorage.getItem("socketUUID")
    );
    this.socketService.send({
      from: this.user,
      content: message,
      hora: Date.now().toString(),
      uuid: localStorage.getItem("socketUUID")
    });
    this.vecMensajes.push({
      from: this.user,
      content: message,
      hora: Date.now().toString(),
      uuid: localStorage.getItem("socketUUID")

    });
    console.log(this.vecMensajes);

    let datosUsuario = {
      Email: "tcastillo@biactiva.com",
      FirstName: "Tomas",
      LastName: "Castillo"
    };
    let rta;
    if (message.includes("quiero hablar con un agente")) {
      let url = "http://localhost:54549/api/ConnectChat/" + this.instancia;
      this.http.post(url, datosUsuario).subscribe(data => {
        rta = "Se ha conectado con un agente de soporte";
        //ACA SE LE ENVIA TODA LA INFO DEL CHAT AL AGENTE DE RN********
        let cadenasMensajes = " ";
        for (var i = 0; i < this.vecMensajes.length; i++) {
          cadenasMensajes = cadenasMensajes
            .concat(" From: ")
            .concat(this.vecMensajes[i].from.name.toString())
            .concat(" Mensaje: ")
            .concat(this.vecMensajes[i].content.toString())
            .concat(" Hora: ")
            .concat(this.vecMensajes[i].hora.toString());
        }
        console.log(
          cadenasMensajes
        ); /**
        let url = "http://localhost:54549/api/Message/" + this.instancia;
        let req = {
          Created: Date.now(),
          Body: {
            Text: cadenasMensajes
          }
        };
        let headers = new HttpHeaders().set("Content-Type", "application/json");
        this.httpclient.post(url, req, { headers: headers }).subscribe(data => {
          let answer = data[0].Body.Text;
          console.log(data[0].Body.Text);
          if (
            data[0].Body.Text ==
            "¿Puede expresarse con otras palabras? No he entendido."
          ) {
            answer = data[1].Body.Text;
          }
          this.socketService.send({
            from: this.orquestador,
            content: answer,
            hora: Date.now()
          });
          this.vecMensajes.push({
            from: this.user,
            content: answer,
            hora: Date.now()
          });
          console.log(this.vecMensajes);
        });*/
      });
    } else {
      rta = null;

      let url = "http://localhost:54549/api/Message/" + this.instancia;
      let req = {
        Created: Date.now().toString(),
        Body: {
          Text: message
        }
      };
      let headers = new HttpHeaders().set("Content-Type", "application/json");
      this.httpclient.post(url, req, { headers: headers }).subscribe(data => {
        let answer = data[0].Body.Text;
        console.log(data[0].Body.Text);
        if (
          data[0].Body.Text ==
          "¿Puede expresarse con otras palabras? No he entendido."
        ) {
          answer = data[1].Body.Text;
        }
        this.socketService.send({
          from: this.orquestador,
          content: answer,
          hora: Date.now().toString(),
          uuid: localStorage.getItem("socketUUID")

        });
        this.vecMensajes.push({
          from: this.user,
          content: answer,
          hora: Date.now().toString(),
          uuid: localStorage.getItem("socketUUID")

        });
        console.log(this.vecMensajes);
      });
    }
    this.messageContent = null;
  }

  public sendNotification(params: any, action: Action): void {
    let message: Message;

    if (action === Action.JOINED) {
      message = {
        from: this.user,
        action: action,
        hora: Date.now().toString(),
        uuid: localStorage.getItem("socketUUID")

      };
    } else if (action === Action.RENAME) {
      message = {
        action: action,
        content: {
          username: this.user.name,
          previousUsername: params.previousUsername
        },
        hora: Date.now().toString(),
        uuid: localStorage.getItem("socketUUID")

      };
    }

    this.socketService.send(message);
    this.vecMensajes.push({
      from: this.user,
      content: message,
      hora: Date.now().toString(),
      uuid: localStorage.getItem("socketUUID")

    });
    console.log(this.vecMensajes);
  }
}

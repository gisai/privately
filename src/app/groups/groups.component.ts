import {ChangeDetectorRef, Component, OnInit} from '@angular/core';

// @ts-ignore
import Groups from '../../assets/contracts/Groups.json'
import {GroupContact, Message} from "../modules/chat.entities";
import {GroupController} from "../modules/groups.module";
import {Store} from "../modules/store";
import {Router} from "@angular/router";
import {Observable} from "rxjs";

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.css']
})

export class GroupsComponent implements OnInit {

  public selectedGroup: GroupContact | undefined = undefined
  private GroupController: GroupController;
  public messagesObservable: Observable<Message[]> = new Observable<Message[]>()

  /*
  0: uso normal
  1: creando chat
  2: invitando al chat
   */
  private userActions = 1

  constructor(private store: Store, private cdr: ChangeDetectorRef, private router: Router) {
    this.GroupController = new GroupController(this.store.getCurrentAccountAddressValue(), cdr)
  }

  async ngOnInit(): Promise<void> {
    this.store.getCurrentAccountAddress().subscribe(_ => {
      this.selectedGroup = undefined
      this.GroupController.destroy()
      this.GroupController = new GroupController(this.store.getCurrentAccountAddressValue(), this.cdr)
    })
  }

  ngOnDestroy(): void {
    this.GroupController.destroy();
  }

  async sendMessage(message: any): Promise<void> {
    console.log('group.component send message')
    console.log(message)
    if (this.selectedGroup == undefined)
      throw 'Cannot send message to undefined. You need to pick a contact first.'

    await this.GroupController.sendMessage(this.selectedGroup, message);
  }

  get getAddresses(): string[] {
    let addresses: string[] = []
    for (let contact of this.GroupController.getContacts()) {
      addresses.push(contact.getAddress())
    }
    return addresses
  }

  async setSelectedAddress(groupAddress: string): Promise<void> {
    this.selectedGroup = this.getContact(groupAddress);
    if (!this.GroupController.isSubscribed(groupAddress))
      await this.GroupController.subscribeToSendMessage(groupAddress);
    this.userActions = 0
    this.cdr.detectChanges();
  }

  private getContact(address: string): GroupContact | undefined {
    for (let contact of this.GroupController.getContacts()) {
      if (contact.getAddress() == address)
        return contact
    }
    return undefined
  }

  getSelectedAddress(): string {
    return this.selectedGroup?.getAddress() ?? ''
  }

  getMessagesSelected(): any {
    console.log('get messages selected')
    if (this.selectedGroup == undefined)
      throw 'Cannot get messages: contact is undefined'

    return this.selectedGroup.getMessages()
  }

  onNewChat(): void {
    this.userActions = 1
    this.selectedGroup = undefined
  }

  async newChat($event: any, name: any): Promise<void> {
    $event.preventDefault()
    console.log(name)
    await this.GroupController.newChat(name)
    this.userActions = 1
  }

  get userActionStatus(): number {
    return this.userActions;
  }

  onNewInvite(): void {
    this.userActions = 2
  }

  async newInvite($event: any, address: any) {
    $event.preventDefault()
    console.log(address.value)
    if (this.selectedGroup == undefined)
      throw 'Must select group first'
    await this.GroupController.newInvite(address.value, this.selectedGroup)
    this.userActions = 0
  }
}

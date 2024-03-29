// @ts-ignore
import Groups from '../../assets/contracts/Groups.json'
import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {GroupContact, Message} from "../modules/chat.entities";
import {GroupController} from "../modules/groups.module";
import {Store} from "../modules/store";
import {Router} from "@angular/router";
import {Observable} from "rxjs";
import {InvitedialogComponent} from "../invitedialog/invitedialog.component";
import {MatDialog, MatDialogConfig} from "@angular/material/dialog";
import {PermdialogComponent} from "../permdialog/permdialog.component";
import {NewgroupdialogComponent} from "../newgroupdialog/newgroupdialog.component";

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.css'],
})

export class GroupsComponent implements OnInit {

  public selectedGroup: GroupContact | undefined = undefined
  private GroupController: GroupController;
  public messagesObservable: Observable<Message[]> = new Observable<Message[]>()

  constructor(private store: Store, private cdr: ChangeDetectorRef, private router: Router, public dialog: MatDialog) {
    this.GroupController = new GroupController(this.store.getCurrentAccountValue().address, this.store.getCurrentAccountValue().publicKey, cdr)
  }

  async ngOnInit(): Promise<void> {
    this.store.getCurrentAccount().subscribe(_ => {
      this.selectedGroup = undefined
      this.GroupController.destroy()
      this.GroupController = new GroupController(this.store.getCurrentAccountValue().address, this.store.getCurrentAccountValue().publicKey, this.cdr)
    })
  }

  ngOnDestroy(): void {
    this.GroupController.destroy();
  }

  async sendMessage(message: any): Promise<void> {
    if (this.selectedGroup == undefined)
      throw 'Cannot send message to undefined. You need to pick a contact first.'

    await this.GroupController.sendMessage(this.selectedGroup, message);
  }

  getCardsInfo(): any[] {
    let groups: any[] = []
    for (let group of this.GroupController.getGroups()) {
      groups.push({
        title: group.getGroupName(),
        data: group.getAddress()
      })
    }
    return groups
  }

  async setSelectedAddress(groupAddress: string): Promise<void> {

    if (this.selectedGroup?.getAddress() == groupAddress)
      return

    this.selectedGroup = this.GroupController.getGroup(groupAddress);

    if (!this.GroupController.isSubscribed(groupAddress))
      await this.GroupController.subscribeToSendMessage(groupAddress);
    this.cdr.detectChanges();
  }

  getSelectedGroupName(): string {
    return this.selectedGroup?.getGroupName() ?? ''
  }

  getMessagesSelected(): Observable<Message[]> {
    if (this.selectedGroup == undefined)
      return new Observable()
    return this.selectedGroup.getMessages()
  }

  onNewChat(): void {
    const dialogConf = new MatDialogConfig()
    dialogConf.disableClose = false;
    const dialogRef = this.dialog.open(NewgroupdialogComponent, dialogConf);
    dialogRef.afterClosed().subscribe(async address => {
      if (address == undefined)
        return
      await this.GroupController.newChat(address)
    });
  }

  async newChat($event: any, name: any): Promise<void> {
    $event.preventDefault()
    await this.GroupController.newChat(name.value)
  }

  openInviteDialog() {
    const dialogConf = new MatDialogConfig()

    dialogConf.disableClose = false;

    const dialogRef = this.dialog.open(InvitedialogComponent, dialogConf);

    dialogRef.afterClosed().subscribe(async address => {
      if (address == undefined)
        return
      if (this.selectedGroup == undefined)
        throw 'Must select group first'
      await this.GroupController.newInvite(address, this.selectedGroup)
    });
  }

  openPermDialog() {
    const dialogConf = new MatDialogConfig()

    dialogConf.disableClose = false;

    const dialogRef = this.dialog.open(PermdialogComponent, dialogConf);

    dialogRef.afterClosed().subscribe(async data => {
      if (data == undefined)
        return
      if (this.selectedGroup == undefined)
        throw 'Must select group first'
      await this.GroupController.givePerms(data.address, this.selectedGroup, data.permissions)
    });
  }
}

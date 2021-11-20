import {Component, OnInit} from '@angular/core';
import {environment} from '../../environments/environment';

import {encrypt, decrypt} from '../modules/encryption.module';

import getToken from 'totp-generator';

// @ts-ignore
import DeadDrop from '../../assets/contracts/DeadDrop.json'

declare const window: any;

@Component({
  selector: 'app-dead-drop',
  templateUrl: './dead-drop.component.html',
  styleUrls: ['./dead-drop.component.css']
})
export class DeadDropComponent implements OnInit {

  private selectedAddress = 'PEDRO'
  private dummy: Map<string, string[]> = new Map([['Dummy', ['Mensajes']]])//[['PEDRO', ['HOLA PEDRO', 'que tal??']], ['SERGIO', ['HOLA SERGIO', 'que tal??']], [environment.dummy_address, ['HOLA PACO', 'que tal??']]]
  // private dummy: Map<string, string[]> = new Map([['PEDRO', ['HOLA PEDRO', 'que tal??']], ['SERGIO', ['HOLA SERGIO', 'que tal??']], [environment.dummy_address, ['HOLA PACO', 'que tal??']]])

  private contacts: Map<string, string> = new Map();

  private contract = new window.web3.eth.Contract(
    DeadDrop.abi,
    environment.deaddrop_address
  )

  constructor() {
  }

  async ngOnInit(): Promise<void> {
    console.log('onInit (dummy): ' + this.dummy)

    //Registramos los eventos para escuchar si te llegan mensajes y si te llegan semillas

    let addresses = await window.ethereum.request({method: 'eth_accounts'});
    this.contract.getPastEvents('ShareSeed', {
      filter: {'to': addresses[0]},
      fromBlock: 0
    }, (error: any, events: any) => this.onShareSeed(error, events))
      .then(() => {
        this.contract.events.SendMessage({
          fromBlock: 0
        }, (error: any, event: any) => this.onMessageEvent(error, event))
      })
  }

  // Cuando llega un mensaje se añade a la lista de mensajes
  onMessageEvent(error: any, event: any): void {
    // Check errors
    if (error !== null)
      throw error
    console.log('Ha llegado un mensaje: ')
    console.log(event)
    console.log('Es para mi el mensaje: ' + this.isTheMessageForMe(event))
    // Check if the message is for me
    if (!this.isTheMessageForMe(event)) return

    // Decrypt message
    let message = decrypt(event.returnValues.message, '', {})

    // Add message to the corresponding chat
    let from = event.returnValues.from

    // @ts-ignore
    let messages: string[] = this.dummy.get(from) == undefined ? [] : this.dummy.get(from)
    messages.push(message)
    this.dummy.set(from, messages)
    console.log(this.dummy)
    console.log('Mensaje recibido: ' + message)
  }

  // Checks if the message is for me
  isTheMessageForMe(event: any): boolean {
    const from = String(event.returnValues.from)

    console.log('De quien es el mensaje: ' + from)
    console.log('Tengo su semilla?: ' + this.contacts.get(from))

    if (this.contacts.get(from) !== undefined) {
      // @ts-ignore
      const token = getToken(this.contacts.get(from), {
        digits: 64,
        algorithm: 'SHA-512',
        period: 60,
        // @ts-ignore
        timestamp: Number(event.returnValues.timestamp)
      })
      return event.returnValues.totp == token
    }
    return false;
  }

  async sendMessage(message: any): Promise<void> {
    // todo
    let encryptedMessage = encrypt(message, '', {})
    const timestamp = Date.now()
    const token = getToken(<string>this.contacts.get(this.selectedAddress), {
      digits: 128,
      algorithm: 'SHA-512',
      period: 60,
      // @ts-ignore
      timestamp: Number(timestamp)
    })
    console.log(token)
    // Enviarlo a la red
    let addresses = await window.ethereum.request({method: 'eth_accounts'});
    this.contract.methods.sendMessage(token, timestamp, encryptedMessage).send({from: addresses[0]})
      .then((receipt: any) => {
        console.log('Recibo de envio de mensaje satisfactorio: ')
        console.log(receipt)
      })
  }

  // Cuando llega una semilla la añadimos a la lista de semillas
  async onShareSeed(error: any, events: any): Promise<void> {
    if (error !== null)
      throw error

    let addresses = await window.ethereum.request({method: 'eth_accounts'});

    for (let event of events) {
      // Check if the message is for me
      if (event.returnValues.to.toLowerCase() == addresses[0].toLowerCase()) {
        const from = String(event.returnValues.from)
        const seed = String(event.returnValues.seed)
        this.contacts.set(from, seed)
      }
    }
  }

  // Create a new chat
  async newChat($event: any, address: any): Promise<void> {
    $event.preventDefault()

    let addresses = await window.ethereum.request({method: 'eth_accounts'});

    const destinationAddress = address.value
    let token_seed: string = 'ALFABETO' // todo hacer semilla aleatoria

    // Add new contact to my contact list
    this.contacts.set(destinationAddress, token_seed)

    //this.contract.methods.getPublicKey(destinationAddress).call().then((result: any); todo conseguir clave publica de destino

    token_seed = encrypt(token_seed, '', {})

    this.contract.methods.shareSeed(destinationAddress, token_seed).send({from: addresses[0]}).then(((receipt: any) => {
          console.log('Mensaje de envio de nueva semilla: ' + receipt)
        }
      )
    )
  }

  getAddresses(): string[] {
    return [...this.dummy.keys()];
  }

  setSelectedAddress(address: string): void {
    this.selectedAddress = address
  }

  getSelectedAddress(): any {
    return this.selectedAddress
  }

  getMessagesSelected(): any {
    return this.dummy.get(this.selectedAddress)
  }
}

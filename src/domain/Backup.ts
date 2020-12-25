import { Moment } from 'moment';

export class Backup {

  constructor(public name: string, public vm: number, public date: Moment, public remote: boolean, public keep: boolean = false) {
  }

}

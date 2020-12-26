import { Moment, unitOfTime } from 'moment';

export class Backup {

  constructor(public name: string, public vm: number, public date: Moment, public remote: boolean, public keep: boolean = false) {
  }

  endOfPeriod(unit: unitOfTime.StartOf): Moment {
    return this.date.clone().endOf(unit);
  }

}

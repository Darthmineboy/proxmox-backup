import { ParsedBackupName } from './domain/ParsedBackupName';
import moment from 'moment';
import { ENV_FILE_NAME } from './env';

const nameRegex = new RegExp(ENV_FILE_NAME);

export function parseBackupName(name: string): ParsedBackupName | null {
    const match = nameRegex.exec(name);
    if (match) {
        return {
            vm: +match.groups['vm'],
            date: moment({
                year: +match.groups['year'],
                // 0 indexed
                month: parseInt(match.groups['month'], 10) - 1,
                day: parseInt(match.groups['day'], 10),
                hour: parseInt(match.groups['hour'], 10),
                minute: parseInt(match.groups['minute'], 10),
                second: parseInt(match.groups['second'], 10),
                millisecond: 0,
            }),
        };
    } else {
        return null;
    }
}

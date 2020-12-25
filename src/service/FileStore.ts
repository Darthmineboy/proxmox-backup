import { mkdirSync, promises } from 'fs';

export const DATA_DIR = 'data';

mkdirSync(DATA_DIR)

export class FileStore implements BackupStore {

  list(): Promise<string[]> {
    return promises.readdir(DATA_DIR);
  }

}

interface BackupStore {

  list(): Promise<string[]>

}

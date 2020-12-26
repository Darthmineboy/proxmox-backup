This is a small NodeJS app that downloads your Proxmox backups using SFTP.
It is packaged as a Docker container for easy installation.

I use this app to download my Proxmox backups nightly to a NAS with Docker support.

# Features
* Configurable backup retention to keep N daily, weekly, monthly and yearly backups.
    * The backups that are retained by the Proxmox server can be different from the backups
    that are retained by this app. This is because this app does not simply synchronize
    all backups from the Proxmox host, instead this app has it's own backup retention.
    The idea behind this is that if your Proxmox host is compromised, 
    and all backups are deleted, then the backups are still retained by this app.
    
# Docker compose
```yaml
version: '3.4'
services:
  backup:
    build: .
    environment:
      - CRON=0 0 * * *
      - SFTP_HOST=123.123.123.123
      - SFTP_PORT=22
      - SFTP_USER=root
      - SFTP_PASSWORD=password
      - SFTP_CONCURRENCY=1
      - RUN_AFTER_START=true
      - DIRECTORY=/var/lib/vz/dump
      - FILE_NAME=vzdump-qemu-(?<vm>\d+)-(?<year>\d+)_(?<month>\d+)_(?<day>\d+)-(?<hour>\d+)_(?<minute>\d+)_(?<second>\d+).vma.+
      - KEEP_DAILY=7
      - KEEP_WEEKLY=4
      - KEEP_MONTHLY=6
      - KEEP_YEARLY=3
```


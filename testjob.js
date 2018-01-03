const CronJob = require('cron').CronJob;




let afterJob = new CronJob(new Date('2018-01-02 23:19:30.000Z'), function() {
    console.log('You will see this message every second');
    this.stop();
}, () => console.log('stopping job'), true, 'America/Los_Angeles');
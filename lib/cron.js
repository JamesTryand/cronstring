
module.exports = function (string) {
  return new CronString(string).toString();
};

function CronString(string) {

  this.string = string;
  this.tokens = this.string.toLowerCase().split(' ');
  this.error = false;

  this.cron = {
    minutes: '*',
    hours: '*',
    dayOfMonth: '*',
    month: '*',
    dayOfWeek: '*'
  };
  this.setTime = false;

  this.lex();
}

CronString.prototype.add = function (type, value) {
  var curr = this.cron[type];

  if (type === 'minutes' || type === 'hours')
    this.setTime = true;

  // Join with "," if necessary
  this.cron[type] = curr.match(/^\d+(,(.*))?$/) ? curr + ',' + value : value;
};

var dayOffset = function (day) {
  switch (day) {
    case 'sunday':
      return 0;
    case 'monday':
      return 1;
    case 'tuesday':
      return 2;
    case 'wednesday':
      return 3;
    case 'thursday':
      return 4;
    case 'friday':
      return 5;
    case 'saturday':
      return 6;
  }
};

// every tuesday

CronString.prototype.lex = function () {
  for (var i = 0, len = this.tokens.length; i < len; i++) {
    var token = this.tokens[i];
    var next = this.tokens[i + 1];
    var previous = this.tokens[i - 1];
    var match = false;

    // Every is implied
    if (token === 'every' || (token === 'and' && next === 'every'))
      continue;

    if (token.match(/^(mon|tues|wednes|thurs|fri|satur|sun)day$/)) {
      // Handle explit days
      this.add('dayOfWeek', dayOffset(token));
    } else if (token === 'at' || token === 'and') {
      // Handle explit time
      var hours, mins;
      if (match = next.match(/^(0)?(\d+)(:\d+)?(am|pm|)?/)) {
        hours = +match[2];
        if (match[4] === 'pm')
          hours += 12;

        hours = hours.toString();
        mins = match[3] && match[3].substr(1);
      } else if (match = next.match(/(midnight|noon|midday)/)) {
        hours = match[0] === 'midnight' ? '00' : '12';
      }

      // if (hours && mins && this.cron.minutes !== '*' && this.cron.hours !== '*') {
      //   return this.error = 'You cannot specify multiple times and minutes';
      // }

      this.add('hours', hours);

      if (token === 'at' || this.cron.minutes === '*')
        this.add('minutes', mins || '00');

      i++;
    } else if (match = token.match(/minute(s)?/)) {
      this.add('minutes', '*/' + (isNumeric(previous) ? previous : '1'));
    } else if (match = token.match(/hour(s)?/)) {
      this.add('hours', '*/' + (isNumeric(previous) ? previous : '1'));
    }
  }
};

CronString.prototype.toString = function () {
  if (this.error)
    return this.error;

  var cron = this.cron;

  if (!this.setTime)
    cron.minutes = cron.hours = '00';

  return [
    cron.minutes,
    cron.hours,
    cron.dayOfMonth,
    cron.month,
    cron.dayOfWeek
  ].join(' ');
};

var isNumeric = function (n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

nodebb-plugin-checkin
=====================

[![NPM version](https://img.shields.io/npm/v/nodebb-plugin-checkin.svg)](https://npmjs.org/package/nodebb-plugin-checkin)

A [NodeBB](https://github.com/NodeBB/NodeBB) plugin to allow user checking-in daily to get reputation reward.

## Installation

[![NPM](https://nodei.co/npm/nodebb-plugin-checkin.png?downloads=true)](https://nodei.co/npm/nodebb-plugin-checkin/)

This plugin requires NodeBB 1.7.0 or higher and node.js 8 or higher.

After enable this plugin, please drag it to navigation.

Please be careful that the checking-in date is based on the time zone of your server. Most servers have `UTC` as the default time zone. If this isn't intended, please set `TZ` environment value to the time zone you want, such as `Asia/Shanghai`, and restart your NodeBB instance.

## Configuration

The default configuration is that a user may get 20 reputation if he/she is the first user to check-in on a certain day, other users may get 5 to 9 reputation. After 7 continuous days, the reward will be 40 for 1st checked-in user, 10-19 for other users. When a user submits the first topic or reply after checking-in, he/she may get doubled reputation award.

You may change the configuration by editing `config.json` like this:

```json
{
    "checkin": {
        "postReward": true,
        "rewards": [
            {
                "firstReward": 20,
                "minReward": 5,
                "maxReward": 9
            },
            {
                "continuousDay": 7,
                "firstReward": 40,
                "minReward": 10,
                "maxReward": 19
            }
        ]
    }
}
```

## LICENSE

[MIT](LICENSE)

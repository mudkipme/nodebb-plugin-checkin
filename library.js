const util = require('util');
const nconf = module.parent.require('nconf');
const User = module.parent.require('./user');
const db = module.parent.require('./database');
const routeHelpers = module.parent.require('./routes/helpers');
const controllerHelpers = module.parent.require('./controllers/helpers');

const checkinConfig = nconf.get('checkin') || {
    postReward: true,
    rewards: [
        {
            firstReward: 20,
            minReward: 5,
            maxReward: 9
        },
        {
            continuousDay: 7,
            firstReward: 20,
            minReward: 5,
            maxReward: 9
        }
    ]
};

const checkingIn = new Set();

const Checkin = {
    getNavigation(items, callback) {
        items.push({
            route: '/checkin',
            title: '[[checkin:check-in]]',
            enabled: true,
            iconClass: 'fa-id-badge',
            textClass: 'visible-xs-inline',
            text: '[[checkin:check-in]]'
        });
        callback(null, items);
    },

    load({ router, middleware }, callback) {
        const render = function (req, res, next) {
            res.render('checkin', {
                title: '[[checkin:check-in]]',
                breadcrumbs: controllerHelpers.buildBreadcrumbs([
                    {
                        text: '[[checkin:check-in]]'
                    }
                ])
            });
        };

        routeHelpers.setupPageRoute(router, '/checkin', middleware, [middleware.ensureLoggedIn], render);
        return setImmediate(callback, null);
    },

    postCreate() {

    },

    appendUserFieldsWhitelist(data, callback) {
        data.whitelist.push('checkinContinuousDays');
        return setImmediate(callback, null, data);
    }
};

async function doCheckin(uid) {
    if (!uid) {
        throw new Error('[[error:not-logged-in]]');
    }

    const now = Date.now();
    const today = dateKey(now);
    const yesterday = dateKey(now - 864e5);
    let reward = 0;
    let cont

    const checkedIn = await util.promisify(db.sortedSetScore)(`checkin-plugin:${today}`, uid);
    if (!checkedIn) {
        if (checkingIn.has(uid)) {
            // This is rough check and might have some problem with multiple NodeBB instance
            throw new Error('[[checkin:too-busy]]');
        }
        try {
            checkingIn.add(uid);
            const [rank, lastCheckin, continuousDays] = await Promise.all([
                util.promisify(db.increment)(`checkin-plugin:rank:${today}`),
                util.promisify(db.getSortedSetRange)(`checkin-plugin:user:${uid}`, 0, 0),
                util.promisify(User.getUserField)(uid, 'checkinContinuousDays')
            ]);

            const continuous = continuousDays && lastCheckin && lastCheckin[0] === yesterday;
            continuousDays = continuous ? continuousDays + 1 : 1;

            await Promise.all([
                util.promisify(db.sortedSetAdd)(`checkin-plugin:${today}`, rank, uid),
                util.promisify(db.sortedSetAdd)(`checkin-plugin:user:${uid}`, now, today),
                util.promisify(User.setUserField)(uid, 'checkinContinuousDays', continuousDays)
            ]);

            for (let item of checkinConfig.rewards) {
                if (continuousDays >= (item.continuousDay || 0)) {
                    reward = (rank === 1) ? item.firstReward
                        : item.minReward + Math.floor(Math.random() * (item.maxReward - item.minReward + 1))
                }
            }

            await util.promisify(User.incrementUserFieldBy)(uid, 'reputation', reward);
            checkingIn.delete(uid);
        }
        catch (e) {
            checkingIn.delete(uid);
            throw e;
        }
    }
}

function dateKey(timestamp) {
    const date = new Date(timestamp);
    return date.getFullYear() + `${date.getMonth() + 1}`.padStart(2, '0') + `${date.getDate() + 1}`.padStart(2, '0');
}

module.exports = Checkin;
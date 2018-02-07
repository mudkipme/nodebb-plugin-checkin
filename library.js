const util = require('util');
const nconf = module.parent.require('nconf');
const _ = module.parent.require('lodash');
const User = module.parent.require('./user');
const db = module.parent.require('./database');
const Notifications = module.parent.require('./notifications');
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
            firstReward: 40,
            minReward: 10,
            maxReward: 19
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
        const render = async function (req, res, next) {
            try {
                const data = await doCheckin(req.uid);
                res.render('checkin', {
                    title: '[[checkin:check-in]]',
                    breadcrumbs: controllerHelpers.buildBreadcrumbs([
                        {
                            text: '[[checkin:check-in]]'
                        }
                    ]),
                    ...data
                });
            } catch (err) {
                next(err);
            }
        };

        routeHelpers.setupPageRoute(router, '/checkin', middleware, [middleware.ensureLoggedIn], render);
        return setImmediate(callback, null);
    },

    async postCreate({ post, data }, callback) {
        if (!checkinConfig.postReward) {
            callback(null, { post, data });
            return;
        }
        try {
            const today = dateKey(Date.now());
            const [checkedIn, checkinPendingReward] = await Promise.all([
                util.promisify(db.isSortedSetMember)(`checkin-plugin:${today}`, data.uid),
                util.promisify(User.getUserField)(data.uid, 'checkinPendingReward')
            ]);
            if (checkedIn && checkinPendingReward > 0) {
                await Promise.all([
                    util.promisify(User.incrementUserFieldBy)(data.uid, 'reputation', checkinPendingReward),
                    util.promisify(User.setUserField)(data.uid, 'checkinPendingReward', 0)
                ]);
                const noti = await util.promisify(Notifications.create)({
                    bodyShort: `[[checkin:post-message, ${checkinPendingReward}]]`,
                    bodyLong: `[[checkin:post-message, ${checkinPendingReward}]]`,
                    nid: 'checkin_' + data.uid,
                    from: data.uid,
                    path: '/checkin'
                });
                await util.promisify(Notifications.push)(noti, data.uid);
            }
            callback(null, { post, data });
        } catch (err) {
            callback(err);
        }
    },

    appendUserFieldsWhitelist(data, callback) {
        data.whitelist.push('checkinContinuousDays');
        data.whitelist.push('checkinPendingReward');
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
    const checkedIn = await util.promisify(db.isSortedSetMember)(`checkin-plugin:${today}`, uid);

    let reward = 0;
    if (!checkedIn) {
        if (checkingIn.has(uid)) {
            // This is rough check and might have some problem with multiple NodeBB instance
            throw new Error('[[checkin:too-busy]]');
        }
        try {
            checkingIn.add(uid);
            const [rank, checkedInYesterday, continuousDays, total] = await Promise.all([
                util.promisify(db.increment)(`checkin-plugin:rank:${today}`),
                util.promisify(db.isSortedSetMember)(`checkin-plugin:${yesterday}`, uid),
                util.promisify(User.getUserField)(uid, 'checkinContinuousDays'),
                util.promisify(db.sortedSetCard)(`checkin-plugin:user:${uid}`)
            ]);

            const continuousDay = checkedInYesterday ? (parseInt(continuousDays) || 0) + 1 : 1;

            for (let item of checkinConfig.rewards) {
                if (continuousDay >= (item.continuousDay || 0)) {
                    reward = (rank === 1) ? item.firstReward
                        : item.minReward + Math.floor(Math.random() * (item.maxReward - item.minReward + 1))
                }
            }

            await Promise.all([
                util.promisify(db.sortedSetAdd)(`checkin-plugin:${today}`, rank, uid),
                util.promisify(db.sortedSetAdd)(`checkin-plugin:user:${uid}`, now, today),
                util.promisify(db.sortedSetAdd)('checkin-plugin:continuous', continuousDay, uid),
                util.promisify(db.sortedSetAdd)('checkin-plugin:total', total + 1, uid),
                util.promisify(User.setUserFields)(uid, {
                    checkinContinuousDays: continuousDay,
                    checkinPendingReward: reward
                }),
                util.promisify(User.incrementUserFieldBy)(uid, 'reputation', reward)
            ]);
            checkingIn.delete(uid);
        }
        catch (e) {
            checkingIn.delete(uid);
            throw e;
        }
    }

    const [total, rank, userData, todayList, continuousList, totalList] = await Promise.all([
        util.promisify(db.sortedSetCard)(`checkin-plugin:user:${uid}`),
        util.promisify(db.sortedSetScore)(`checkin-plugin:${today}`, uid),
        util.promisify(User.getUserFields)(uid, ['checkinContinuousDays', 'checkinPendingReward']),
        util.promisify(db.getSortedSetRangeWithScores)(`checkin-plugin:${today}`, 0, 9),
        util.promisify(db.getSortedSetRevRangeWithScores)('checkin-plugin:continuous', 0, 9),
        util.promisify(db.getSortedSetRevRangeWithScores)('checkin-plugin:total', 0, 9)
    ]);

    const uids = _.map(_.concat(todayList, continuousList, totalList), 'value');
    const users = _.keyBy(await util.promisify(User.getUsersFields)(uids, ['username', 'userslug']), 'uid');

    const [todayMembers, continuousMembers, totalMembers] = [todayList, continuousList, totalList]
        .map(list => list.map(item => ({
            username: users[item.value].username,
            userslug: users[item.value].userslug,
            score: item.score
        })));

    return {
        checkedIn,
        postReward: checkinConfig.postReward && parseInt(userData.checkinPendingReward) > 0,
        rank,
        continuousDay: userData.checkinContinuousDays,
        reward,
        total,
        todayMembers,
        continuousMembers,
        totalMembers
    };
}

function dateKey(timestamp) {
    const date = new Date(timestamp);
    return date.getFullYear() + `${date.getMonth() + 1}`.padStart(2, '0') + `${date.getDate()}`.padStart(2, '0');
}

module.exports = Checkin;
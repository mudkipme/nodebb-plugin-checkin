const nconf = require.main.require('nconf');
const _ = require.main.require('lodash');
const User = require.main.require('./src/user');
const db = require.main.require('./src/database');
const Notifications = require.main.require('./src/notifications');
const routeHelpers = require.main.require('./src/routes/helpers');
const controllerHelpers = require.main.require('./src/controllers/helpers');

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
    async getNavigation(items) {
        items.push({
            route: '/checkin',
            title: '[[checkin:check-in]]',
            enabled: true,
            iconClass: 'fa-id-badge',
            textClass: 'visible-xs-inline',
            text: '[[checkin:check-in]]'
        });
        return items;
    },

    async load({ router, middleware }) {
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
    },

    async postCreate({ post, data }) {
        if (!checkinConfig.postReward) {
            return { post, data };
        }

        const today = dateKey(Date.now());
        const [checkedIn, checkinPendingReward] = await Promise.all([
            db.isSortedSetMember(`checkin-plugin:${today}`, data.uid),
            User.getUserField(data.uid, 'checkinPendingReward')
        ]);
        if (checkedIn && checkinPendingReward > 0) {
            await Promise.all([
                User.incrementUserReputationBy(data.uid, checkinPendingReward),
                User.setUserField(data.uid, 'checkinPendingReward', 0)
            ]);
            const noti = await Notifications.create({
                bodyShort: `[[checkin:post-message, ${checkinPendingReward}]]`,
                bodyLong: `[[checkin:post-message, ${checkinPendingReward}]]`,
                nid: 'checkin_' + data.uid,
                from: data.uid,
                path: '/checkin'
            });
            await Notifications.push(noti, data.uid);
        }
        return { post, data };
    },

    async appendUserFieldsWhitelist(data) {
        data.whitelist.push('checkinContinuousDays');
        data.whitelist.push('checkinPendingReward');
        return data;
    }
};

async function doCheckin(uid) {
    if (!uid) {
        throw new Error('[[error:not-logged-in]]');
    }

    const now = Date.now();
    const today = dateKey(now);
    const yesterday = dateKey(now - 864e5);
    const checkedIn = await db.isSortedSetMember(`checkin-plugin:${today}`, uid);

    let reward = 0;
    if (!checkedIn) {
        if (checkingIn.has(uid)) {
            // This is rough check and might have some problem with multiple NodeBB instance
            throw new Error('[[checkin:too-busy]]');
        }
        try {
            checkingIn.add(uid);
            const [rank, checkedInYesterday, continuousDays, total] = await Promise.all([
                db.increment(`checkin-plugin:rank:${today}`),
                db.isSortedSetMember(`checkin-plugin:${yesterday}`, uid),
                User.getUserField(uid, 'checkinContinuousDays'),
                db.sortedSetCard(`checkin-plugin:user:${uid}`)
            ]);

            const continuousDay = checkedInYesterday ? (parseInt(continuousDays) || 0) + 1 : 1;

            for (let item of checkinConfig.rewards) {
                if (continuousDay >= (item.continuousDay || 0)) {
                    reward = (rank === 1) ? item.firstReward
                        : item.minReward + Math.floor(Math.random() * (item.maxReward - item.minReward + 1))
                }
            }

            await Promise.all([
                db.sortedSetAdd(`checkin-plugin:${today}`, rank, uid),
                db.sortedSetAdd(`checkin-plugin:user:${uid}`, now, today),
                db.sortedSetAdd('checkin-plugin:continuous', continuousDay, uid),
                db.sortedSetAdd('checkin-plugin:total', total + 1, uid),
                User.setUserFields(uid, {
                    checkinContinuousDays: continuousDay,
                    checkinPendingReward: reward
                }),
                User.incrementUserReputationBy(uid, reward)
            ]);
            checkingIn.delete(uid);
        }
        catch (e) {
            checkingIn.delete(uid);
            throw e;
        }
    }

    const [total, rank, userData, todayList, continuousList, totalList] = await Promise.all([
        db.sortedSetCard(`checkin-plugin:user:${uid}`),
        db.sortedSetScore(`checkin-plugin:${today}`, uid),
        User.getUserFields(uid, ['checkinContinuousDays', 'checkinPendingReward']),
        db.getSortedSetRangeWithScores(`checkin-plugin:${today}`, 0, 9),
        db.getSortedSetRevRangeWithScores('checkin-plugin:continuous', 0, 9),
        db.getSortedSetRevRangeWithScores('checkin-plugin:total', 0, 9)
    ]);

    const uids = _.map(_.concat(todayList, continuousList, totalList), 'value');
    const users = _.keyBy(await User.getUsersFields(uids, ['username', 'userslug']), 'uid')

    const [todayMembers, continuousMembers, totalMembers] = [todayList, continuousList, totalList]
        .map(list => list.filter(item => users[item.value] !== undefined))
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

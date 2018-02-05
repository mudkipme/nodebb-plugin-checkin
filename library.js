const nconf = module.parent.require('nconf');
const User = module.parent.require('./user');
const db = module.parent.require('./database');
const routeHelpers = module.parent.require('./routes/helpers');
const controllerHelpers = module.parent.require('./controllers/helpers');

const Library = {
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
        callback();
    }
};

module.exports = Library;
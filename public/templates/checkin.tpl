<!-- IMPORT partials/breadcrumbs.tpl -->

<div class="alert alert-info" role="alert">
    [[checkin:info-message, 1]]
    [[checkin:days-message, 1, 1]]
    [[checkin:post-reward]]
</div>
<div class="alert alert-success" role="alert">
    <p>
        <strong>[[checkin:success]]</strong>
        [[checkin:success-message, 1, 1]]
        [[checkin:info-message, 1]]
    </p>
    <p>
        [[checkin:days-message, 1, 1]]
        [[checkin:post-reward]]
    </p>
</div>
<div class="row">
    <div class="col-md-4">
        <h4>[[checkin:today-rank]]</h4>
        <table class="table table-bordered">
            <tr>
                <th>#</th>
                <th>[[checkin:member]]</th>
            </tr>
        </table>
    </div>
    <div class="col-md-4">
        <h4>[[checkin:continuous-rank]]</h4>
        <table class="table table-bordered">
            <tr>
                <th>[[checkin:member]]</th>
                <th>[[checkin:days]]</th>
            </tr>
        </table>
    </div>
    <div class="col-md-4">
        <h4>[[checkin:total-rank]]</h4>
        <table class="table table-bordered">
            <tr>
                <th>[[checkin:member]]</th>
                <th>[[checkin:days]]</th>
            </tr>
        </table>
    </div>
</div>
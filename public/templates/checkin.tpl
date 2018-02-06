<!-- IMPORT partials/breadcrumbs.tpl -->

<!-- IF checkedIn -->
<div class="alert alert-info" role="alert">
    [[checkin:info-message, {rank}]]
    [[checkin:days-message, 1, 1]]
    <!-- IF postReward -->
    [[checkin:post-reward]]
    <!-- ENDIF postReward -->
</div>
<!-- ELSE -->
<div class="alert alert-success" role="alert">
    <p>
        <strong>[[checkin:success]]</strong>
        [[checkin:success-message, {reward}]]
        [[checkin:info-message, {rank}]]
    </p>
    <p>
        [[checkin:days-message, 1, 1]]
        <!-- IF postReward -->
        [[checkin:post-reward]]
        <!-- ENDIF postReward -->
    </p>
</div>
<!-- ENDIF checkedIn -->
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
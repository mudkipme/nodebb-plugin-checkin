<!-- IMPORT partials/breadcrumbs.tpl -->

<!-- IF checkedIn -->
<div class="alert alert-info" role="alert">
    [[checkin:info-message, {rank}]]
    [[checkin:days-message, {continuousDay}, {total}]]
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
        [[checkin:days-message, {continuousDay}, {total}]]
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
            <!-- BEGIN todayMembers -->
            <tr>
                <td>{todayMembers.score}</td>
                <td><a href="{config.relative_path}/user/{todayMembers.userslug}">{todayMembers.username}</a></td>
            </tr>
            <!-- END todayMembers -->
        </table>
    </div>
    <div class="col-md-4">
        <h4>[[checkin:continuous-rank]]</h4>
        <table class="table table-bordered">
            <tr>
                <th>[[checkin:member]]</th>
                <th>[[checkin:days]]</th>
            </tr>
            <!-- BEGIN continuousMembers -->
            <tr>
                <td><a href="{config.relative_path}/user/{continuousMembers.userslug}">{continuousMembers.username}</a></td>
                <td>{continuousMembers.score}</td>
            </tr>
            <!-- END continuousMembers -->
        </table>
    </div>
    <div class="col-md-4">
        <h4>[[checkin:total-rank]]</h4>
        <table class="table table-bordered">
            <tr>
                <th>[[checkin:member]]</th>
                <th>[[checkin:days]]</th>
            </tr>
            <!-- BEGIN totalMembers -->
            <tr>
                <td><a href="{config.relative_path}/user/{totalMembers.userslug}">{totalMembers.username}</a></td>
                <td>{totalMembers.score}</td>
            </tr>
            <!-- END totalMembers -->
        </table>
    </div>
</div>
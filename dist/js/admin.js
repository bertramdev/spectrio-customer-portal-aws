// ADMIN
// https://mnk2ecc85j.execute-api.us-east-1.amazonaws.com/dev/purpleProxy
var proxyHost = 'mnk2ecc85j.execute-api.us-east-1.amazonaws.com';
var purpleAggregate = 'https:/'+proxyHost+'/dev/purpleAggregateVenueVisitors';
var purpleStore = 'https:/'+proxyHost+'/dev/purpleStore';
var customerURL = 'https:/'+proxyHost+'/dev/customer';
function storeCustomers() {
    var customers = [
        {
            id: 1335221,
            customerName: 'LabCorp',
            timeZoneOffset: -7,
            phoneAccountId: 1335221,
            phoneApiToken: '2MGwU2rQ0dmx3ao6H89pMMhBuoUPQbxSCIyclJVCLHAQGCMw'
        },
        {
            id: 4286,
            customerName: 'Spectrio',
            purpleAccountId: 4286,
            timeZoneOffset: -7,
            purplePublicKey: 'ca722481fcff8361d4fe2ac3a476aba4',
            purplePrivateKey: 'fcc4780fc12bdf89e0bc81371e45d9b3',
            phoneAccountId: 74241,
            phoneApiToken: 'YcUnhXPWWwZXfj2itaF7iPhZkmCb0DIhBDPZLy8MORKr0a5H'
        }
        
    ];
    $('#output').text('');

    $.each(customers, function(idx, customer){
        $.ajax({
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            url:customerURL + '/'+customer.id,
            method:'PUT',
            data: JSON.stringify(customer)
        })
        .done(function(responseObj) {
            console.log(responseObj);
            $('#output').text($('#output').text()+JSON.stringify(responseObj, null, 2)+'\n\n');

        });
    });
    //alert('Done');
}
function requestAggs(s, e) {
    let now = new Date();
    if(s.isBefore(now)) {
        var q = '&from='+s.format('YYYYMMDD')+'&to='+e.format('YYYYMMDD');
        console.log(q);
        $.ajax(purpleAggregate + '?customerId=4286'+q)
        .done(function(responseObj) {
            console.log(responseObj);
            let o = $('#output').text();
            o += (JSON.stringify(responseObj, null, 2)+'\n');
            $('#output').text(o);
            s.add(2, 'days');
            e.add(2, 'days');
            requestAggs(s, e);
        });
    }
    else {
        alert('Done');
    }
    
}

function aggregateVisitors() {
    var range = parseInt($('#store-all').data('days'));
    var now = new Date();
    var s = moment().add(-1*range, 'days');
    var e = moment(s).add(1, 'days');
    var o = '';
    $('#output').text(null);
    requestAggs(s, e);

}
$(document).ready(function() {
    let dd = $('#days-dropdown');
    let nowM = moment();
    let o = '';
    for (let ii = 1; ii <= 90; ii++) {
        nowM.add(-1, 'days');
        o +='<a class="dropdown-item store-range" href="#" data-days="'+ii+'">'+nowM.format('MM/DD/YYYY')+'</a>';
        if (ii == 30) {
            $('#visitor-days2').text(nowM.format('MM/DD/YYYY'));
        }
    }
    dd.append(o);

    if (Cookies.get('loggedInX')!='true') {
        $('#loginModal').modal('show');
    }
    $('.store-range').on('click', function() {
        var days = $(this).data('days');
        $('#store-all').data('days', days);
        let m = moment().add(-1*parseInt(days), 'days');
        $('#visitor-days2').text(m.format('MM/DD/YYYY'));
    });
    $('#store-all').on('click', function() {
        aggregateVisitors();
    });

    $('#store-customers').on('click', function() {
        storeCustomers();
    });
    $('#login-button').on('click', function() {
        var b = eval(atob('YnRvYSgkKCdbbmFtZT0icGFzc3dvcmQiXScpLnZhbCgpKSA9PSAnTVRJelUzQmxZM1J5YVc4a0pBPT0nICYmIGJ0b2EoJCgnW25hbWU9InVzZXJuYW1lIl0nKS52YWwoKSkgPT0gJ1UzQmxZM1J5YVc4PSc='));
        if (b)  {
            $('#login-error').hide();
            $('#loginModal').modal('hide');
            Cookies.set('loggedInX', 'true', {expires:1/24});
        }
        else {
            $('#login-error').text('Invalid username or password');
            $('#login-error').show();
            Cookies.set('loggedInX', 'false', {expires:1/24});
        }
    });
    $('#logout').on('click', function(evt) {
        Cookies.set('loggedInX', 'false', {expires:1/(24*60*60)});
        document.location.reload();
    });

});            
// END ADMIN
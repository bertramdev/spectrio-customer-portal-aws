var proxyHost = 'mnk2ecc85j.execute-api.us-east-1.amazonaws.com';
var customerURL = 'https:/'+proxyHost+'/dev/customer';
var purpleProxy = 'https:/'+proxyHost+'/dev/purpleProxy';
var purpleFetchAggs = 'https:/'+proxyHost+'/dev/purpleFetchVenueDailyTotals';
var accountId = 4286;
var customerId;
var venues;
function getVenues() {
    var path = '/api/company/v1/venues';
    console.log(purpleProxy + '?customerId='+ customerId+ '&path='+path);
    $.ajax(purpleProxy + '?customerId='+ customerId+ '&path='+path)
        .done(function(responseObj) {
            console.log(responseObj);
            $('#venues-select').empty();
            if (responseObj.success && responseObj.data.venues) {
                $('#venues-select').append('<option value="all">All Venues</name>');
                venues = responseObj.data.venues;
                venues.sort(function(a, b){return a.name.localeCompare(b.name);});
                $.each(venues, function(idx, itm) {
                    $('#venues-select').append('<option value="'+itm.id+'">'+itm.name+'</name>');
                });
                $('.venues-enabled').removeAttr('disabled');
                $('#venue-detail').show();
                selectVenue('all');
            }
            else {
                $('#venues-select').append('<option value="-1">Unable to load venues</name>');
            }
        });
}
function exportVisitors() {
    var path = '/api/company/v1/venue/'+$('#venues-select').val()+'/visitors?';
    let days = parseInt($('[name="agg-days"]:checked').val());

    path += ('from='+moment().add(-1*days, 'days').format('YYYYMMDD'));
    path += ('&to='+moment().format('YYYYMMDD'));
    console.log(purpleProxy + '?path='+path);
    $.ajax(purpleProxy + '?customerId='+ customerId+ '&path='+encodeURIComponent(path))
        .done(function(responseObj) {
            console.log(responseObj);
            if (responseObj.success && responseObj.data.visitors) {
                var visitors = responseObj.data.visitors;
                var csv = 'id,first_name,last_name,gender,date_of_birth,location,email,mobile,first_seen,last_seen,visits,source\r\n';
                $.each(visitors, function(idx, itm) {
                    csv +=(itm.id+',"'+itm.first_name+'","'+(itm.last_name||'')+'","'+(itm.gender||'')+'","'+(itm.date_of_birth||'')+'","'+(itm.location||'')+'","'+(itm.email||'')+'","'+(itm.mobile||'')+'","'+(itm.first_seen||'')+'",'+itm.last_seen+','+itm.visits+',"'+itm.source+'"');
                    csv += '\r\n';
                });
                exportCSV(csv, 'guests.csv');
            }
            else {
                alert('No guests found.');
            }
        });
}

var map;
function myMap() {
    var mapCanvas = document.getElementById("map");
    var mapOptions = {
        //center: new google.maps.LatLng(51.5, -0.2),
        zoom: 14
    };
    map = new google.maps.Map(mapCanvas, mapOptions);
}

function init() {
    $.ajax(customerURL+'/'+accountId)
    .done(function(respObj) {
        if (respObj && respObj.success) {
            customerId = respObj.data.purpleAccountId;
            getVenues();                        
        }
        else {
            alert('Huge problem!');
        }
    });                
}

function exportCSV(csv, name) {
    let csvContent = "data:text/csv;charset=utf-8,"+csv;
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", name);
    document.body.appendChild(link); // Required for FF
    link.click(); // This will download the data file named "my_data.csv". 
    document.body.removeChild(link);               
}

function loadAnalytics(matchId) {
    let days = parseInt($('[name="agg-days"]:checked').val()),
        to  = moment(),
        from = moment().add(-1*days, 'days');
    console.log('loading analytics for '+matchId +' for '+days+' days');
        
    let fromP = from.format('YYYYMMDD'),
        toP = to.format('YYYYMMDD');
    let aggUrl = purpleFetchAggs + '?customerId='+customerId+'&venueId='+matchId+'&from='+fromP+'&to='+toP;
    $.ajax(aggUrl)
    .done(function(responseObj) {
        //console.log(responseObj);
        if (responseObj.success && responseObj.data) {
            $('#sources').text(responseObj.data.sourceCaptured);
            $('#age').text(responseObj.data.ageCaptured);
            $('#visitors').text(responseObj.data.visitors);
            $('#visits').text(Math.max(responseObj.data.visits,responseObj.data.visitors));
            $('#gender').text(responseObj.data.genderCaptured);

            var data = [['Gender', 'Count']];
            for (let k in responseObj.data.gender) {
                data.push([k.substr(0,1).toUpperCase()+k.substr(1), responseObj.data.gender[k]]);
            }
            //console.log(data);
            let chart = new google.visualization.PieChart(document.getElementById('gender-pie'));
            chart.draw(google.visualization.arrayToDataTable(data));

            let ageData = [['Age', 'Count']];
            for (let k in responseObj.data.age) {
                ageData.push([k.replace('age','').replace('to', ' to ').replace('Over', 'Over '), responseObj.data.age[k]]);
            }
            //console.log(ageData);
            let ageChart = new google.visualization.PieChart(document.getElementById('age-pie'));
            ageChart.draw(google.visualization.arrayToDataTable(ageData));

            var sourceData = [['Source', 'Count']];
            for (let k in responseObj.data.source) {
                sourceData.push([k.substr(0,1).toUpperCase()+k.substr(1), responseObj.data.source[k]]);
            }
            console.log(data);
            let sourceChart = new google.visualization.PieChart(document.getElementById('source-pie'));
            sourceChart.draw(google.visualization.arrayToDataTable(sourceData));

        }
        else {
            alert('No guests found.');
        }
    });
    
}

function selectVenue(matchId) {
    $('.export-btn,.days-btn').attr('disabled', 'true');       
    let venue
    if (matchId != '-1' && matchId != 'all') {
        venue = $.grep(venues, function(itm, idx) {
            return itm.id == parseInt(matchId);
        });    
    }
    let addressString = '';
    if (venue && venue.length) {
        addressString = venue[0].name + '\n'+venue[0].address1+'\n';
        if (venue[0].address2) addressString += venue[0].address2 + '\n';
        if (venue[0].address3) addressString += venue[0].address3 + '\n';
        if (venue[0].address4) addressString += venue[0].address4 + '\n';
        if (venue[0].town) addressString += venue[0].town + '\n';
        $('#onlineNow').text(venue[0].users_online_now);
        $('#online24').text(venue[0].users_online_24_hours);
        if (venue[0].hardware && venue[0].hardware.length) {
            console.log(venue[0].hardware);
            addressString += ('Hardware: '+venue[0].hardware[0].name + ' ('+venue[0].hardware[0].brand+')\n');
        }
        addressString += ('Status: '+venue[0].status + '\n');
        var myCenter = new google.maps.LatLng(venue[0].latitude,venue[0].longitude);
        var marker = new google.maps.Marker({position: myCenter, venueId:venue[0].id});
        marker.setMap(map);
        map.setCenter(myCenter);
        // /dev/purpleFetchVenueDailyTotals?customerId=4286&venueId=12427&from=20180101&to=20180328
        map.setZoom(14);
        $('.export-btn').removeAttr('disabled');       
    }
    else if (matchId == 'all') {
        let onlineNow = 0, online24 = 0;
        var bounds = new google.maps.LatLngBounds();
        venues.forEach(function(venue) {
            addressString += venue.name + '\n'+venue.address1+'\n';
            if (venue.address2) addressString += venue.address2 + '\n';
            if (venue.address3) addressString += venue.address3 + '\n';
            if (venue.address4) addressString += venue.address4 + '\n';
            if (venue.town) addressString += venue.town + '\n';
            if (venue.hardware && venue.hardware.length) {
                console.log(venue.hardware);
                addressString += ('Hardware: '+venue.hardware.name + ' ('+venue.hardware.brand+')\n');
            }
            addressString += ('Status: '+venue.status + '\n\n');
            var myCenter = new google.maps.LatLng(venue.latitude,venue.longitude);
            var marker = new google.maps.Marker({position: myCenter, venueId:venue.id});
            bounds.extend(myCenter);
            marker.setMap(map);
    
        });       
        map.fitBounds(bounds);
        $('#onlineNow').text(onlineNow);
        $('#online24').text(online24);

    }
    if (matchId != '-1') {
        loadAnalytics(matchId);
        $('.days-btn').removeAttr('disabled');       
        
    }
    $('[name="address"]').val(addressString);        
}

$(document).ready(function() {
    if (Cookies.get('loggedInX')!='true') {
        $('#loginModal').modal('show');
    }
    else {
        init();
    }
    
    $('#venues-select').on('change', function(evt) {
        let matchId = $(this).val();
        if (matchId != '-1') {
            $('#venue-detail').show();
            selectVenue(matchId);
        }
        else {
            $('#venue-detail').hide();

        }

    });
    $('[name="agg-days"]').on('change', function() {
        let matchId = $('#venues-select').val();
        loadAnalytics(matchId);

    });
    $('#export-visitors').on('click', function() {
        exportVisitors();
    });
    $('.store-range').on('click', function() {
        var days = $(this).data('days');
        $('#store-all').data('days', days);
        $('#visitor-days2').text(days);
    });
    $('#export-all').on('click', function() {
        var csv = 'id,name,address1,address2,address3,address4,town,telephone,email,users_online_now,users_online_24_hours,status\r\n';
        $.each(venues, function(idx, itm) {
            csv +=(itm.id+',"'+itm.name+'","'+(itm.address1||'')+'","'+(itm.address2||'')+'","'+(itm.address3||'')+'","'+(itm.address4||'')+'","'+(itm.town||'')+'","'+(itm.telephone||'')+'","'+(itm.email||'')+'",'+itm.users_online_now+','+itm.users_online_24_hours+',"'+itm.status+'"');
            csv += '\r\n';
        });
        exportCSV(csv, 'venues.csv');
    });

    $('#login-button').on('click', function() {
        var b = eval(atob('YnRvYSgkKCdbbmFtZT0icGFzc3dvcmQiXScpLnZhbCgpKSA9PSAnTVRJelUzQmxZM1J5YVc4a0pBPT0nICYmIGJ0b2EoJCgnW25hbWU9InVzZXJuYW1lIl0nKS52YWwoKSkgPT0gJ1UzQmxZM1J5YVc4PSc='));
        if (b)  {
            $('#login-error').hide();
            init();
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


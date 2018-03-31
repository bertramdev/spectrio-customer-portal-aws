var proxyHost = 'mnk2ecc85j.execute-api.us-east-1.amazonaws.com';
var customerURL = 'https:/'+proxyHost+'/dev/customer';
var aggregateURL = 'https:/'+proxyHost+'/dev/callLogAggregate';
var customerId;
var accountId;
var lastOffset = 0;
var headers;

function exportVoiceMail() {
    document.body.style.cursor='wait';
    $('#export-voice-mail').attr('disabled',true);
    $('#export-voice-mail').html('<i>Downloading...</i>');
    let extId = $('#extensions-select').val();
    
    let extFilter = '';
    if (extId != '-1') {
        extFilter += '&filters[extension]='+extId;
    }
    let useStorage = false;
    if (typeof(Storage) !== "undefined") {
        useStorage = true;
        localStorage.voice_mail = '';
    }
    
    let csv = 'id,to,extension,extension_name,is_new,from_number,from_name,from_city,from_state,created_at,duration,folder\n';
    let fetchFxn = function(offset) {
        offset = offset || 0;
        $.ajax('https://api.phone.com/v4/accounts/'+accountId+'/voicemail?offset='+offset+'&limit='+PAGE_SIZE+extFilter, {
            headers: headers
        })
        .done(function(data) {
            data.items.forEach(function(item) {
                let ext = '',
                    extension_name = '',
                    from = {number:'',name:'',city:'',state:''},
                    createdDate = '';
                if (item.extension) {
                    ext = item.extension.extension;
                    extension_name = item.extension.name; 
                }
                if (item.from) {
                    from.number = item.from.number;
                    from.name = item.from.name;
                    from.city = item.from.city;
                    from.state = item.from.state;
                }
                if (item.created_at) createdDate = new Date(item.created_at*1000).toString();
                csv += encodeURI(item.id+',"'+item.to+'","'+ext+'","'+extension_name+'","'+item.is_new+'","'+from.number+'","'+from.name+'","'+from.city+'","'+from.state+'","'+createdDate+'","'+item.duration+'","'+item.folder+'"\n');
            });
            if (useStorage) {
                localStorage.voice_mail += csv;
                csv = '';
            }
            if (data.total > offset + PAGE_SIZE) {
                fetchFxn(offset+PAGE_SIZE);
            }
            else {
                if (useStorage) {
                    csv = localStorage.voice_mail;
                }
                console.log(csv);
                exportCSV(csv, 'voice_mail.csv');
                document.body.style.cursor='default';
                $('#export-voice-mail').removeAttr('disabled').html('Export All');
            }
        });
    }
    fetchFxn(0);
}

function fetchVoiceMail(offset) {
    $('#voicemail-table>tbody').empty();
    $('#page-info').text(null);
    offset = offset || 0;
    let extId = $('#extensions-select').val();				
    let url = 'https://api.phone.com/v4/accounts/'+accountId+'/voicemail?limit=50&sort[created_at]=desc&offset='+offset;
    if (extId != '-1') {
        url += '&filters[extension]='+extId;
    }
    $.ajax(url, {
        headers: headers
    })
    .done(function(data) {
        $.each(data.items, function(idx, itm) {
            $('#voicemail-table>tbody').append($('<tr><td width="35%" class="small" style="overflow:hidden;"><nobr>'+moment(itm.created_at*1000).format('M/D/YY h:mm a')+'</nobr></td>'+
                '<td width="55%" class="small" style="overflow:hidden;"><nobr>'+itm.to+' '+itm.extension.extension+'</nobr><br/><nobr>'+itm.from.name+'</nobr><br/><nobr>'+itm.from.number+' ('+itm.from.city+', '+itm.from.state+')</nobr></td>'+
                '<td width="10%" class="small" styleX="text-align:right;"><nobr><button type="button" class="btn btn-sm btn-primary playButton voicemail-button" data-voicemail-id="'+itm.id+'"><span class="oi oi-media-play" title="'+itm.duration+' seconds" ></span></button>'+
                '<button type="button" class="d-none d-sm-block btn btn-sm btn-primary downloadButton voicemail-button" data-voicemail-id="'+itm.id+'"><span class="oi oi-cloud-download"></span></button></nobr></td></tr>'));
        });
        if (data.total > 0) {
            $('#page-info').text((offset+1) +' - '+ Math.min(offset+50, data.total) +' of '+data.total);
        }
        else {
            $('#page-info').text('No voice mail');
        }
        lastOffset = offset;
    });
}

function playHandler() {
    if (this.readyState === this.DONE) {
        if (this.status === 200) {
            var downloadUrl = URL.createObjectURL(this.response);
            const audio = document.querySelector('#voicemail-audio');
            audio.src = downloadUrl;
            audio.play();
            $('#audio-container').show();
        } else {
            console.error('XHR failed', this);
        }
    }
};

function downloadHandler() {
    if (this.readyState === this.DONE) {
        if (this.status === 200) {
            var downloadLink      = document.createElement('a');
            downloadLink.target   = '_blank';
            downloadLink.download = 'voicemail.wav';
            var URL = window.URL || window.webkitURL;
            var downloadUrl = URL.createObjectURL(this.response)
            downloadLink.href = downloadUrl;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(downloadUrl);
        } else {
            console.error('XHR failed', this);
        }
    }
};

function downloadVoiceMail(id, handler) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://api.phone.com/v4/accounts/'+accountId+'/voicemail/'+id+'/download');
    xhr.onreadystatechange = handler;
    xhr.responseType = 'blob';
    xhr.setRequestHeader('Authorization', headers.Authorization);
    xhr.send();

}
function exportCSV(csv, name) {
    let encodedUri = "data:text/csv;charset=utf-8,"+csv;
    //var encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", name);
    document.body.appendChild(link); // Required for FF
    link.click(); // This will download the data file named "my_data.csv". 
    document.body.removeChild(link);               
}

const PAGE_SIZE = 350;

function exportCallLogs(days) {
    document.body.style.cursor='wait';
    $('[data-days="'+days+'"]').attr('disabled',true).html('<i>Downloading...</i>');
    let extId = $('#extensions-select').val();
    
    let extFilter = '';
    if (extId != '-1') {
        extFilter += '&filters[extension]='+extId;
    }
    let useStorage = false;
    if (typeof(Storage) !== "undefined") {
        useStorage = true;
        localStorage.call_logs = '';
    }
    let csv = 'id,type,called_number,extension,caller_id,start_time,call_duration,final_action\n';
    let startUnix = (moment().subtract(days,'d').startOf('day').unix());
    let fetchFxn = function(offset) {
        offset = offset || 0;
        $.ajax('https://api.phone.com/v4/accounts/'+accountId+'/call-logs?offset='+offset+'&limit='+PAGE_SIZE+'&filters[start_time]=gt:'+startUnix+extFilter, {
            headers: headers
        })
        .done(function(data) {
            data.items.forEach(function(item) {
                let ext = '';
                if (item.extension) ext = item.extension.extension;
                csv += encodeURI(item.id+','+item.type+',"'+item.called_number+'",'+ext+',"'+item.caller_id+'","'+item.start_time+'",'+item.call_duration+',"'+item.final_action+'"\n');
            });
            if (useStorage) {
                localStorage.call_logs += csv;
                csv = '';
            }
            if (data.total > offset + PAGE_SIZE) {
                fetchFxn(offset+PAGE_SIZE);
            }
            else {
                if (useStorage) {
                    csv = localStorage.call_logs;
                }
                exportCSV(csv, 'call_logs_'+days+'_days.csv');
                document.body.style.cursor='default';
                $('[data-days="'+days+'"]').removeAttr('disabled').html('Export');
            }
        });
    }
    fetchFxn(0);
}
const materialOptions = {
    series: { 0: {axis: 'Count'}, 1: {axis: 'Duration'} },
    axes: {
        y: { Count: {label: 'Count'}, Duration: {label: 'Duration'}}
    }
};

function updateBarChart(nm, data) {
    $('#'+nm+'-chart').empty();
    if (data[nm].length > 1) {
        chart = new google.visualization.BarChart(document.getElementById(nm+'-chart'));
        let cfg = {
            chartArea:{width:(nm=='states_count'?'80%':'65%'),right:5,height:'100%'},
            legend: { position:'none'},
            vAxis: {textStyle:{fontSize:(nm == 'hour_count'?7.5:null)}}
        };
        console.log(cfg);
        chart.draw(google.visualization.arrayToDataTable(data[nm]), cfg);
    }
    else {
        $('#'+nm+'-chart').html('<div class="nodata">No data</div>');
    }
}
function updateColumnChart(nm, data) {
    $('#'+nm+'-chart').empty();
    if (data[nm].length > 1) {
        chart = new google.visualization.ColumnChart(document.getElementById(nm+'-chart'));
        let cfg = {
            chartArea:{width:'90%',right:5,height:'80%',top:5},
            legend: { position:'none'},
            hAxis: {slantedText:true,slantedTextAngle:60,textStyle:{fontSize:(nm == 'hour_count'?8:null)}}
        };
        console.log(cfg);
        chart.draw(google.visualization.arrayToDataTable(data[nm]), cfg);
    }
    else {
        $('#'+nm+'-chart').html('<div class="nodata">No data</div>');
    }
}

function updateMapChart(nm, data, reg, mode, res) {
    var data = google.visualization.arrayToDataTable(data[nm]);
    var options = {
        displayMode: 'regions',
        region: 'US'
    };
    if (reg) options.region = reg;
    if (mode) options.displayMode = mode;
    if (res) options.resolution = res;
    if (mode == 'markers') {
        options.colorAxis= {colors: ['#4374e0', '#e7711c']};
    }
    var chart = new google.visualization.GeoChart(document.getElementById(nm+'-chart'));
    chart.draw(data, options);
}			

function loadMetrics() {
    let extId = $('#extensions-select').val();
    
    let extFilter = '';
    if (extId != '-1') {
        extFilter += '&extensionId='+extId;
    }
    let days = parseInt($('[name="agg-days"]:checked').val());
    let m = moment().add(-1*(days), 'days').startOf('day');
    let fromFilter = '&from='+m.format('YYYYMMDD')+'&to='+moment().add(5,'day').format('YYYYMMDD');
    
    $('.export-btn').attr('disabled','true');
    $('#export-logs').attr('data-days', days);
    $.ajax(aggregateURL+'?customerId='+customerId+extFilter+fromFilter)
    .done(function(data) {
        $('#call-total').text(data.meta.total);
        $('#call-avg-duration').text(Math.round(data.data.avg_call_duration));
        let chart = new google.visualization.PieChart(document.getElementById('hour_count-chart'));
        chart = new google.visualization.PieChart(document.getElementById('day_count-chart'));
        chart.draw(google.visualization.arrayToDataTable(data.data.day_count));
        chart = new google.visualization.PieChart(document.getElementById('direction-pie'));
        chart.draw(google.visualization.arrayToDataTable(data.data.direction_count));
        data.data.area_codes_count_orig = data.data.area_codes_count;
        //data.data.area_codes_count = [['Area Code','Count']];
        data.data.area_codes_count = [['Latitude','Longitude','Label','Count']];
        data.data.area_codes_count_orig.forEach(function(mbr){
            //data.data.area_codes_count.push(['('+mbr.areaCode+') '+mbr.localities+ ' '+mbr.state, mbr.count]);
            let latLon = mbr.geoPoint.split(',');
            data.data.area_codes_count.push([parseFloat(latLon[0]), parseFloat(latLon[1]), '('+mbr.areaCode+') '+mbr.localities+ ' '+mbr.state,mbr.count]);
        });
        //'states_count',
        updateMapChart('states_count', data.data, 'US', 'regions','provinces');
        //,'area_codes_count'
        updateMapChart('area_codes_count', data.data, 'US', 'markers');
        ['final_action_count','action_count'].forEach(function(nm) {
                updateBarChart(nm, data.data);
        });
        ['hour_count'].forEach(function(nm) {
                updateColumnChart(nm, data.data);
        });
        data.data.calls_over_time.shift();
        $('#calls-line').empty();					
        if (data.data.calls_over_time.length) {
            let dataTable = new google.visualization.DataTable();
            dataTable.addColumn('string', 'Day');
            dataTable.addColumn('number', "Count");
            dataTable.addColumn('number', "Duration");
            dataTable.addRows(data.data.calls_over_time);
            chart = new google.charts.Line(document.getElementById('calls-line'));
            chart.draw(dataTable, materialOptions);
        }
        else {
            $('#calls-line').html('<div class="nodata">No data</div>');
        }
        $('.export-btn').removeAttr('disabled');
    });		
}

function loadData() {
    customerId = parseInt($('#customer-select').val());
    $('#extensions-select').empty();
    $('#extensions-select').append('<option value="-1">All Extensions</option>');
    $.ajax(customerURL+'/'+customerId)
    .done(function(respObj) {
        if (respObj && respObj.success) {
            accountId = respObj.data.phoneAccountId;
            headers = { Authorization: 'Bearer '+respObj.data.phoneApiToken };
            loadMetrics();
            $.ajax('https://api.phone.com/v4/accounts/'+accountId+'/extensions?limit=300&sort[extension]=asc', {
                headers: headers
            })
            .done(function(data) {
                $.each(data.items, function(idx, itm) {
                    $('#extensions-select').append('<option value="'+itm.id+'">'+itm.extension+' - '+itm.name+'</option>');
                });
                $('#extensions-total').text(data.total);
            });
            fetchVoiceMail();
        }
        else {
            alert('Huge problem!');
        }
    });
}
$(document).ready(function() {
    if (Cookies.get('loggedInX')!='true') {
        $('#loginModal').modal('show');
    }
    else {
        loadData();
    }
    $('[name="agg-days"]').on('change', loadMetrics);
    $('#customer-select').on('change', loadData);
    $('#extensions-select').on('change', function(evt){
        fetchVoiceMail(0);
        loadMetrics();
    });
    $('.export-link').attr('title','Downloads will be executed in the background may take several minutes or more.');				
    $('.export-link').on('click', function(evt){
        exportCallLogs(parseInt($(this).data('days')));
    });
    $('#export-voice-mail').on('click', function(evt){
        exportVoiceMail();
    });				
    $('#previous').on('click', function() {
        if (lastOffset > 0)
            fetchVoiceMail(lastOffset - 50);
    });
    $('#next').on('click', function() {
        fetchVoiceMail(lastOffset + 50);
    });
    $(document).on('click', '.downloadButton',function() {
        let voiceMailId = $(this).data('voicemail-id');
        downloadVoiceMail(voiceMailId, downloadHandler);
    });
    $(document).on('click', '.playButton', function() {
        let qThis = $(this);
        let voiceMailId = qThis.data('voicemail-id');
        $('.hilight').removeClass('hilight');
        qThis.closest('tr').addClass('hilight');
        downloadVoiceMail(voiceMailId, playHandler);
    });
    $('#login-button').on('click', function() {
        var b = eval(atob('YnRvYSgkKCdbbmFtZT0icGFzc3dvcmQiXScpLnZhbCgpKSA9PSAnTVRJelUzQmxZM1J5YVc4a0pBPT0nICYmIGJ0b2EoJCgnW25hbWU9InVzZXJuYW1lIl0nKS52YWwoKSkgPT0gJ1UzQmxZM1J5YVc4PSc='));
        if (b)  {
            $('#login-error').hide();
            loadData();
            $('#loginModal').modal('hide');
            Cookies.set('loggedInX', 'true', {expires:1/24});
        }
        else {
            $('#login-error').text('Invalid username or password');
            $('#login-error').show();
            Cookies.set('loggedInX', 'false'), {expires:1/24};
        }
    });
    $('#logout').on('click', function(evt) {
        Cookies.set('loggedInX', 'false', {expires:1/(24*60*60)});
        document.location.reload();
    });

});
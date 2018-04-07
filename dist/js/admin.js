// ADMIN
var sharedKey = 'S2B4PFPiQKPCVoPU4l8EM8A3AsIGCXVXVfEbcTXB7sZsYqjJpJ58qVNbHzHCbt2';
var purpleAggregate = 'https://'+proxyHost+'/dev/wifi-trigger-calc-cust-venues-totals';
var customerURL = 'https://'+proxyHost+'/dev/customer';
var visitorsURL = 'https://'+proxyHost+'/dev/wifi-search';
var callLogsURL = 'https://'+proxyHost+'/dev/call-log-search';
var purpleProxyURL = 'https://'+proxyHost+'/dev/purple-wifi-proxy';

var customers = [
    {id: 1335221,customerName: 'LabCorp',timeZoneOffset: -7,phoneAccountId: 1335221,phoneApiToken: '2MGwU2rQ0dmx3ao6H89pMMhBuoUPQbxSCIyclJVCLHAQGCMw'},
    {id: 113703,customerName: 'Bill Richie',timeZoneOffset: -7,phoneAccountId: 113703,phoneApiToken: 'Z50ACUNZW4GtaTT0rp6ugN7HEVdtRB2Q2AAJMM8IVuXlZUCL'},
    {id: 108193,customerName: 'Tastea Costa Mesa',timeZoneOffset: -7,phoneAccountId: 108193,phoneApiToken: 'zZ79AMhUzyQJp9T8CbNlKRcnnCPBbvfwHIGj9VEIZNhymL1k'},
    {id: 4286, customerName: 'Spectrio',purpleAccountId: 4286,timeZoneOffset: -7,purplePublicKey: 'ca722481fcff8361d4fe2ac3a476aba4',purplePrivateKey: 'fcc4780fc12bdf89e0bc81371e45d9b3',phoneAccountId: 74241,phoneApiToken: 'YcUnhXPWWwZXfj2itaF7iPhZkmCb0DIhBDPZLy8MORKr0a5H'},
    {customerName: "Intellitouch",id: 51503,phoneAccountId: 51503,phoneApiToken: "ZtAutZU7Bkt9gjxd45KyJA8Bn1FePVpb3eUjy2dv3JD86rEF",timeZoneOffset: -7},
    {customerName: "acquisitions",id: 71144,phoneAccountId: 71144,phoneApiToken: "W7x3KHqn9MpYMSvQv3kpRQi5TIjxe0gZ5WnqNgCjE8kBWC4K",timeZoneOffset: -7},
    {customerName: "guardian-host",id: 98346,phoneAccountId: 98346,phoneApiToken: "aLHVqdiywth8iP1CgQfXVNBzwjcbBxPEkSB5nQ8bksZvkJtR",timeZoneOffset: -7},
    {customerName: "brazzeal-tire",id: 100492,phoneAccountId: 100492,phoneApiToken: "5iAlWYsYsIsXATD8UcDEZ3OYkig4wVKZ9p9pUW8ON6Eo0Gun",timeZoneOffset: -7},
    {customerName: "tulsa-siding",id: 100980,phoneAccountId: 100980,phoneApiToken: "vkSMv5cfQ2OXZlHRdxSmn9IRilAuPp02OkTko4tCXtmtppOm",timeZoneOffset: -7},
    {customerName: "bpb-manwaring",id: 103977,phoneAccountId: 103977,phoneApiToken: "GN4pTLOHnEoS9oHlnYH5VovbOZXcD9ben8Cvvz3t0yM2tr3H",timeZoneOffset: -7},
    {customerName: "leone",id: 106656,phoneAccountId: 106656,phoneApiToken: "rzRbVb2zTGGJKMx1wpBSG4zhZwwRlGAdGaJOUeQEjES3SleV",timeZoneOffset: -7},
    {customerName: "bpb-romero",id: 108020,phoneAccountId: 108020,phoneApiToken: "8H2BRrychhnwERxNsowUQIe2VpvnTJ4hsoEsJpUpywqqMwWH",timeZoneOffset: -7},
    {customerName: "tastea-warehouse",id: 108046,phoneAccountId: 108046,phoneApiToken: "nDvi1Y5t9S9r5W2vjRQ8vZy4RxDlIQAqU19FP6FAYe0It5FP",timeZoneOffset: -7},
    {customerName: "tastea-garden",id: 108161,phoneAccountId: 108161,phoneApiToken: "nXmQgIyZ2iE1CjeaM2QntpW9XeolUAHSdlx2CagWLKBBS48u",timeZoneOffset: -7},
    {customerName: "tastea-rowland",id: 108191,phoneAccountId: 108191,phoneApiToken: "N4nyRu0BC3Qm0npilx4r2Y0dRcsO1MNh05rLf2xUjhWsAjgs",timeZoneOffset: -7},
    {customerName: "bpb-store149",id: 113855,phoneAccountId: 113855,phoneApiToken: "z8oaMG78nNkPmIOrC7XEzLlnzpr3Cl8ieD7dClQf1BpM79hv",timeZoneOffset: -7}        
];

function storeCustomers() {
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
    for (let ii = 1; ii <= 30; ii++) {
        nowM.add(-1, 'days');
        o +='<a class="dropdown-item store-range" href="#" data-days="'+ii+'">'+nowM.format('MM/DD/YYYY')+'</a>';
        if (ii == 7) {
            $('#visitor-days2').text(nowM.format('MM/DD/YYYY'));
        }
    }
    dd.append(o);
    customers.forEach(function(customer, idx) {
        $('#customer-select').append('<option value="'+idx+'">'+customer.customerName+"</option>");
    });
    let encryptCustomer = () => {
        let customer = customers[parseInt($('#customer-select').val())];
        let clone = Object.assign({}, customer); 
        clone.timestamp = new Date().getTime();        
        let json = JSON.stringify(clone, null, 2);
        // Encrypt
        let ciphertext = CryptoJS.AES.encrypt(json,sharedKey);
        return ciphertext;
    };

    $('#generate-auth').on('click', function() {
        let customer = customers[parseInt($('#customer-select').val())];
        let clone = Object.assign({}, customer); 
        clone.timestamp = new Date().getTime();        
        let json = JSON.stringify(clone, null, 2);
        // Encrypt
        let ciphertext = CryptoJS.AES.encrypt(json,sharedKey);
        
        // Decrypt
        let bytes  = CryptoJS.AES.decrypt(ciphertext.toString(), sharedKey);
        var plaintext = bytes.toString(CryptoJS.enc.Utf8);
        
        $('#output').text('AES SHARED KEY:\n'+sharedKey+'\n\nORIGINAL:\n'+json+'\n\nENCRYPTED:\n'+ciphertext+'\n\nDECRYPTED:\n'+plaintext);
    });

    $('#search-visitors').on('click', function() {
        $.ajax(visitorsURL + '?Spectrio-Portal-Auth='+encodeURIComponent(encryptCustomer()))
        .done(function(responseObj) {
            console.log(responseObj);
            $('#output').text(JSON.stringify(responseObj, null, 2));
        });
    });
    $('#search-call-logs').on('click', function() {
        $.ajax(callLogsURL + '?Spectrio-Portal-Auth='+encodeURIComponent(encryptCustomer()))
        .done(function(responseObj) {
            console.log(responseObj);
            $('#output').text(JSON.stringify(responseObj, null, 2));
        });
    });
    $('#purple-proxy').on('click', function() {
        $.ajax(purpleProxyURL + '?Spectrio-Portal-Auth='+encodeURIComponent(encryptCustomer())+'&path=/api/company/v1/venues')
        .done(function(responseObj) {
            console.log(responseObj);
            $('#output').text(JSON.stringify(responseObj, null, 2));
        });
    });

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
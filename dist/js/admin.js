// ADMIN
var sharedKey = 'S2B4PFPiQKPCVoPU4l8EM8A3AsIGCXVXVfEbcTXB7sZsYqjJpJ58qVNbHzHCbt2';
var purpleAggregate = 'https://'+proxyHost+'/wifi-trigger-calc-cust-venues-totals';
var customerURL = 'https://'+proxyHost+'/customer';
var visitorsURL = 'https://'+proxyHost+'/wifi-search';
var callLogsURL = 'https://'+proxyHost+'/call-log-search';
var purpleProxyURL = 'https://'+proxyHost+'/purple-wifi-proxy';

var customers = [
    {id: 1335221,customerName: 'LabCorp',timeZoneOffset: -7,phoneAccountId: 1335221,phoneApiToken: '2MGwU2rQ0dmx3ao6H89pMMhBuoUPQbxSCIyclJVCLHAQGCMw'},
    {id: 113703,customerName: 'Bill Richie',timeZoneOffset: -7,phoneAccountId: 113703,phoneApiToken: 'Z50ACUNZW4GtaTT0rp6ugN7HEVdtRB2Q2AAJMM8IVuXlZUCL'},
    {id: 108193,customerName: 'Tastea Costa Mesa',timeZoneOffset: -7,phoneAccountId: 108193,phoneApiToken: 'zZ79AMhUzyQJp9T8CbNlKRcnnCPBbvfwHIGj9VEIZNhymL1k'},
    {id: 4286, customerName: 'Spectrio',purpleAccountId: 4286,timeZoneOffset: -7,purplePublicKey: 'ca722481fcff8361d4fe2ac3a476aba4',purplePrivateKey: 'fcc4780fc12bdf89e0bc81371e45d9b3',phoneAccountId: 74241,phoneApiToken: 'YcUnhXPWWwZXfj2itaF7iPhZkmCb0DIhBDPZLy8MORKr0a5H'},
    {id: 7212, customerName: 'Jiffy Lube',purpleAccountId: 7212,timeZoneOffset: -7,purplePublicKey: '851873eb64440149735dceffd1930b0e',purplePrivateKey: '378905ffd80d7fb588184a9cdf06e5df'},
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
    {customerName: "bpb-store149",id: 113855,phoneAccountId: 113855,phoneApiToken: "z8oaMG78nNkPmIOrC7XEzLlnzpr3Cl8ieD7dClQf1BpM79hv",timeZoneOffset: -7},
    {customerName: "bpb-wiles",phoneAccountId: 114370,phoneApiToken: "jg9vNEhSJplVUv66VZxYslMccBLzYp7k4dnQQaVmxPDpdLTW",timeZoneOffset: -7}, 
    {customerName: "bpb-zachcarr",phoneAccountId: 114422,phoneApiToken: "2ZsJTcOiJ8BUQklENYiKqMNjsRkxVJYHtY6h79Wg5AFTAZs2",timeZoneOffset: -7}, 
    {customerName: "bpb-alvarez",phoneAccountId: 116927,phoneApiToken: "0LApjm6ILYOIy3MrHIeIGz8RtXBnp0ZpfWAdRlQozp58Q7Cp",timeZoneOffset: -7}, 
    {customerName: "bpb-overland",phoneAccountId: 117572,phoneApiToken: "AvGHOnnahJXfxzzSsuekSDerOTcCVSMCbbHA4gb6t59Mtoqv",timeZoneOffset: -7}, 
    {customerName: "bpb-store365",phoneAccountId: 119982,phoneApiToken: "DID9TF4N8iWuKi70Hb2aVtimkL9TLNGEKes88ixy7Vu2Jd9k",timeZoneOffset: -7}, 
    {customerName: "bpb-store665",phoneAccountId: 121124,phoneApiToken: "3NytSpv4x1Abq5AzfYaqzbbWyOgcJ7rJtLhsXT4JwxVdkRhR",timeZoneOffset: -7}, 
    {customerName: "bpb-mumma",phoneAccountId: 122661,phoneApiToken: "44r9Hw0AdjPjEAb0KpAwUr04wU6mF4awAsGnRD2E6ikAkPCJ",timeZoneOffset: -7}, 
    {customerName: "bpb-schaumann",phoneAccountId: 124053,phoneApiToken: "UdM3aYIZPdGlwjUtEL7a9kGEWzfH2GVMaOugZcYGVZ8PmeI1",timeZoneOffset: -7}, 
    {customerName: "bpb-store664",phoneAccountId: 125440,phoneApiToken: "EvHGuFHWn5pbmcoZqDxKs2QrK3PjX0hWnyCzRvaclwitYSzb",timeZoneOffset: -7}, 
    {customerName: "bpb-store854",phoneAccountId: 155459,phoneApiToken: "B4AQ3p0BwrgqxuopFNylhWybwkXyGuZqWLuuWvSsJqDM3Sbw",timeZoneOffset: -7}, 
    {customerName: "bpb-mcdougal",phoneAccountId: 175301,phoneApiToken: "vM9dsedkIBevCZrx1EPqMt4CjWFUkxxUkCg7b3DLTE26jXnx",timeZoneOffset: -7}, 
    {customerName: "wagnerauto",phoneAccountId: 175390,phoneApiToken: "Gk9UxYYOYLvBvy2lPYNHRGj4hm6SCcIeL6tJ6bBe8yLBjubg",timeZoneOffset: -7}, 
    {customerName: "bpb-williams",phoneAccountId: 184950,phoneApiToken: "xMNE4aU2pWt6ZQ9lSjl92sUwG7e2rNN5cmKezLSlVJ1Tv7wP",timeZoneOffset: -7}, 
    {customerName: "bpb-store408",phoneAccountId: 191482,phoneApiToken: "nw047SB24AtkW1f6kHEq99zIWcRgEQdjkWo4gUrqDwuinoBX",timeZoneOffset: -7}, 
    {customerName: "bpb-store823",phoneAccountId: 198690,phoneApiToken: "ra58azXQTlmCMliGfkt8CwUs7NG8BF4wwfgwU7k3x5RZzd4x",timeZoneOffset: -7}, 
    {customerName: "bp-bessey",phoneAccountId: 211473,phoneApiToken: "AVAsN9lRIEZGKiXk5dVhBcEdbe1hKGHvPTSCcIY1MBCd7gyH",timeZoneOffset: -7}, 
    {customerName: "powers-tire",phoneAccountId: 217035,phoneApiToken: "pvM6hYFIi1gJ90gRao6bj9xDJysDT0UM8Z8Utm0zlm0IpgLc",timeZoneOffset: -7}, 
    {customerName: "bpb-bailey",phoneAccountId: 221947,phoneApiToken: "3YEyR85hqsVdWIKjKZvIP2HnbyIpSaVlpMpEM2e0ccm0vp4p",timeZoneOffset: -7}, 
    {customerName: "bpb-gray",phoneAccountId: 226223,phoneApiToken: "216BVPyytTwVC82qittoQP7gDpsDzNMH6IbZx6fMKwT74hCs",timeZoneOffset: -7}, 
    {customerName: "southern-therapy",phoneAccountId: 252968,phoneApiToken: "LiNDG8JKMeKyBFmhBf1Z6DIvINhh8jPXwqaInyZpGb64GFcL",timeZoneOffset: -7}, 
    {customerName: "sbb",phoneAccountId: 271030,phoneApiToken: "fZlP363EG5mGv4OxdcSrhwHg8AwjC40jey9AvMBdOgAWLKgu",timeZoneOffset: -7}, 
    {customerName: "bpb-herr",phoneAccountId: 338395,phoneApiToken: "AjEn7MtBBVM8ITY9WHUU1G7itJHCF297lqKKx8gnh5rV6jCk",timeZoneOffset: -7}, 
    {customerName: "fredsmithrentals",phoneAccountId: 345295,phoneApiToken: "Mrz9pMUJLFDg7BwL4NBqMsq0XHSNZr6m7lK3rGBjSiW89K6u",timeZoneOffset: -7}, 
    {customerName: "powerstire-manitowoc",phoneAccountId: 352295,phoneApiToken: "aNeCT8bH96A9v8ZWVL9STEIiEXkeeKfVIpuOhApxocdl0Qas",timeZoneOffset: -7}, 
    {customerName: "powerstire-sheboygan",phoneAccountId: 352305,phoneApiToken: "X4mSyCQqaGuCYbQznz1gRgmYKc1ej8R00ue3QrRGkWRTWQgc",timeZoneOffset: -7}, 
    {customerName: "signaturemri",phoneAccountId: 367627,phoneApiToken: "u8fe96uDP7hoYaKrnXsC8G9a0JqMlaEB3r4rtpcX4gjQMOP5",timeZoneOffset: -7}, 
    {customerName: "bpb-kennedy",phoneAccountId: 368916,phoneApiToken: "gYP1Khww8EhUDgfCja0xnmOVzqOTS2D97tnBWoUT3fLAOv78",timeZoneOffset: -7}, 
    {customerName: "bpb-shd",phoneAccountId: 370408,phoneApiToken: "6UZ4cYfDSTdCE8FTk2KbRznTI2kPc6ur88VDGVVOEzF3rE98",timeZoneOffset: -7}, 
    {customerName: "bpb-store964",phoneAccountId: 379672,phoneApiToken: "nbEbkoxZxHnAV6i6cqKXsoZjxz3uL5Kmck57xNgSbsPT4ZJr",timeZoneOffset: -7}, 
    {customerName: "bpb-rohr",phoneAccountId: 379768,phoneApiToken: "broHAWvfYfAOwYNSRI8QNc10Q4fpPlXMnoDWu2gGveBOCGLz",timeZoneOffset: -7}, 
    {customerName: "bpb-store202",phoneAccountId: 386555,phoneApiToken: "3K8sB2owFXu6zoVnoFtMiiSQ2TyxMjJ6dObGSTkddH8lSdw6",timeZoneOffset: -7}, 
    {customerName: "bpb-store276",phoneAccountId: 419259,phoneApiToken: "TEVFfU6PccPAClUiyNfG6lQUaPXzKZuLoNdQ6LmDqvCwxJ0D",timeZoneOffset: -7}, 
    {customerName: "bpb-barron",phoneAccountId: 514060,phoneApiToken: "qNduMnL4Rt8qsUPEx79nQTTGScWJ6PEOAJ7llnWQDs5dVxER",timeZoneOffset: -7}, 
    {customerName: "bpb-store765",phoneAccountId: 571112,phoneApiToken: "t9nAd62dy4WkTFQqlnPf5a3cNsAdgjGX51BWaEWwZ1IZ3SGP",timeZoneOffset: -7}, 
    {customerName: "bpb-store684",phoneAccountId: 580743,phoneApiToken: "7Yn9iuH70uZTPvoknGIhTA02z8rmPKmP3f8hj66aux0BZCiX",timeZoneOffset: -7}, 
    {customerName: "bpb-store771",phoneAccountId: 595253,phoneApiToken: "HCnkOX2BOlTiNo3NRwmVuoGNb5FaGVcAFqqmGWwcNW4MPPBK",timeZoneOffset: -7}, 
    {customerName: "bpb-store235",phoneAccountId: 762502,phoneApiToken: "e0faYljpU4MGcHPevtIxnpRQLhjjlwH6987lQUwwJ7IufHnO",timeZoneOffset: -7}, 
    {customerName: "bpb-stokes@spectrio.com",phoneAccountId: 784071,phoneApiToken: "ptUmqtnHuwUaQC7iEpQtlIxEeBmKQHmXOE4RGbkJiDxlvzJq",timeZoneOffset: -7}, 
    {customerName: "bpbstore168",phoneAccountId: 832332,phoneApiToken: "qA47ni9aKsFE5RQ3vfbT8Gy3tLD7pU2OoCC6OvQgyO3F77H9",timeZoneOffset: -7}, 
    {customerName: "mike.branz@batteriesplus.ne",phoneAccountId: 844326,phoneApiToken: "cYJL11ms9j2ni2DkxZMo80hsdThJT4E9bkueJK7Uix5boRp5",timeZoneOffset: -7}, 
    {customerName: "ed.albrigo@batteriesplus.net",phoneAccountId: 1249197,phoneApiToken: "mKsMShOVIOBuW24xybyscAyU0rsSR8eeqpIwNPAJcGWAt68z",timeZoneOffset: -7}, 
    {customerName: "bpb-tollefson",phoneAccountId: 1249395,phoneApiToken: "yRU1Y2LIk2pDVxu0ZUq5gnpMXPMFN50i24lS3OlJoxIIBOqr",timeZoneOffset: -7}, 
    {customerName: "honkook@gmail.com",phoneAccountId: 1253430,phoneApiToken: "pFJHrt6l0iA9JH0L1qY47WGX3YvoBbeEDQEnV3E4IZipJkm0",timeZoneOffset: -7}, 
    {customerName: "blackscorpion",phoneAccountId: 1256876,phoneApiToken: "GJQtRLhEw3jqgpIyTVijRF0VIfdLKNfYq2CoN8UQtXpSbzqy",timeZoneOffset: -7}, 
    {customerName: "bpb-store904",phoneAccountId: 1263540,phoneApiToken: "N2EvfiWiQWez6zav1kIQ24iitZZB7vbZKySTYrqERGPUbQts",timeZoneOffset: -7}, 
    {customerName: "wsp-lighthouse",phoneAccountId: 1264436,phoneApiToken: "wRdtAU19WEeb2KyFlFyHkGCD4r5Mk9z4fzQ3dEPGQanCr4xn",timeZoneOffset: -7}, 
    {customerName: "eastmemphisoptometry",phoneAccountId: 1267441,phoneApiToken: "xbeklBJbnQ5E4axtWly3juhhtJWkiOQuesUdftw2ar61UMAA",timeZoneOffset: -7}, 
    {customerName: "enviromentalchimney",phoneAccountId: 1280068,phoneApiToken: "W8QXzVoOYJSbQXKzkEYCkdSZdEEyvdluOq6kONgBfUenb7rN",timeZoneOffset: -7}, 
    {customerName: "admin@inreality.com",phoneAccountId: 1334284,phoneApiToken: "yh0CjDMaguUAJSiOdxh3e7OhfcOQcxrbuORbaIPHjBlaBLIH",timeZoneOffset: -7}, 
    {customerName: "scott.enman@batteriesplus.net",phoneAccountId: 1336162,phoneApiToken: "BX8vbQGvTqrBqN6pDTxHoRVoUqtStVGKf8wuYVVygDfW5wvi",timeZoneOffset: -7}, 
    {customerName: "sang.han@batteriesplus.net",phoneAccountId: 1336438,phoneApiToken: "arL5SiQLwybX3B5NLWJHcio8kCZ7wQOAwGtjFDJX63MmBBZv",timeZoneOffset: -7}, 
    {customerName: "kelly@essentialssouthtampa.com",phoneAccountId: 1337089,phoneApiToken: "Yh49unP8MOpAaNIgOYnZCU02oDjkgv5KAUTwtl3RLzmNKtgs",timeZoneOffset: -7}, 
    {customerName: "charlie.norton@batteriesplus.net",phoneAccountId: 1340183,phoneApiToken: "EYocMVSCCGmo3Ngn7geoVWl0AySYZOeMmlScut4lNgMB2Dxh",timeZoneOffset: -7}, 
    {customerName: "natschludt@msn.com",phoneAccountId: 1340607,phoneApiToken: "S8u22dfktyOoupRdzB4if3NXw9DmHYUNzsZ2Esy260En0F8D",timeZoneOffset: -7}, 
    {customerName: "bp207@batteriesplus.net",phoneAccountId: 1340805,phoneApiToken: "WoxpHW3k218LmigWpgESqFLoDiHX0u1KKf4OloDBHy1OdGfE",timeZoneOffset: -7}, 
    {customerName: "rob.scott@batteriesplus.net",phoneAccountId: 1341362,phoneApiToken: "SYRrZILNCquNvgQryjpsBIcIMd3r4ICkzzTSAiKaq0TDVYBO",timeZoneOffset: -7}, 
    {customerName: "chris.cox@batteriesplus.net",phoneAccountId: 1342315,phoneApiToken: "0TcWbUBcDkwgDg57eBkrZPYI9FgsRim68oX8Ln60dW6LKG4h",timeZoneOffset: -7}, 
    {customerName: "chris.hanner@batteriesplus.net",phoneAccountId: 1343680,phoneApiToken: "vUwY40vUpKfHZBbEGTgHztxRZfpOFaGz8VXuH2IHn87wqzyW",timeZoneOffset: -7}, 
    {customerName: "bangbangbites@gmail.com",phoneAccountId: 1344010,phoneApiToken: "ZoJDZryvnkIloiP7n7nXGPwwadgzQFFsCLOnf2MuaO325VDn",timeZoneOffset: -7}, 
    {customerName: "wsp-valrico",phoneAccountId: 1345051,phoneApiToken: "s2xy3PGuDl8kYvw1TaXs7T4VMGpOAFic50ZzlwgZR9ed8VEv",timeZoneOffset: -7}, 
    {customerName: "bpb-store944",phoneAccountId: 1345532,phoneApiToken: "mTUul6JaJFvaKsxw9yKusxb1VYJOh2pvd1U7WlqUfPieObIP",timeZoneOffset: -7}, 
    {customerName: "store687",phoneAccountId: 1345681,phoneApiToken: "EsYJFpAawtKMC7FxTeBVmQ0bo1fiZqToDLMRLrlzCCXdea1P",timeZoneOffset: -7}, 
    {customerName: "varsityclub",phoneAccountId: 1345682,phoneApiToken: "w09F4UaYWdhBt1zO1MJuKI0Yzy3TtxscmxA7xKDRv8iSRF5H",timeZoneOffset: -7}, 
    {customerName: "bpb-store818",phoneAccountId: 1345828,phoneApiToken: "DZc1MZ8wrfJpFSfdF9cLeGLN8n4l9m8YfVkWmhTxsYmgx4pX",timeZoneOffset: -7}, 
    {customerName: "bpb-store766",phoneAccountId: 1345879,phoneApiToken: "GCJNDDjxndlXpkPvIR72BQqN7F7V6kiLlzXlxFzokmpxzmZv",timeZoneOffset: -7}, 
    {customerName: "essentialsofsafetyharbor",phoneAccountId: 1346720,phoneApiToken: "3hduQtdetdKqpzLxxMdFopmKMv2vcgfqWR2dIoyqy6VW8Ik6",timeZoneOffset: -7}, 
    {customerName: "essentialspasalon",phoneAccountId: 1346721,phoneApiToken: "zVfOFZFteBljaQsOkjMUUKHbmxz0sh3oi4a8Aqu4j7EkJcnj",timeZoneOffset: -7}, 
    {customerName: "bpb-store936",phoneAccountId: 1346747,phoneApiToken: "5ATJi0lmwxY4DF42RFicvdLVhnhFJ5EbZZ9AQWr4rTWstMmu",timeZoneOffset: -7}, 
    {customerName: "bpb-store961",phoneAccountId: 1347125,phoneApiToken: "8nXBGuiqzzdDM9fHaep57yfjD4aRTkIEiP7FokPfTsmK2JHN",timeZoneOffset: -7}, 
    {customerName: "bargesa@gmail.com",phoneAccountId: 1347586,phoneApiToken: "mVfbxg95IltR9eZWBjmO1RmlIkrDAThM2E5mV66wX6qP06GQ",timeZoneOffset: -7}
];

function storeCustomers() {
    $('#output').text('');

    $.each(customers, function(idx, customer){
        customer.id = customer.id || customer.phoneAccountId || customer.phoneAccountId;
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
        
        $('#output').text('AES SHARED KEY:\n'+sharedKey+'\n\nORIGINAL:\n'+json+'\n\nENCRYPTED:\n'+ciphertext+'\n\nENCRYPTED + URI ENCODED:\n'+encodeURIComponent(ciphertext)+'\n\nDECRYPTED:\n'+plaintext);
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
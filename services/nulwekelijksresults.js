    angular.module('workfit')
        .service('Store', getSetter);

    // type = username: String with username ==> "wimpethomas_gmail_com"
    // type = testnr: Number with testnumber ==> 3 (in case of loose 'archief' Test testnr = null)
    // type = testgebieden: Array with uitvalgebieden ==> ["competentie", "zelfstandigheid"]
    // type = testresults: Object with testresults per uitvalgebied ==> {"competentie": {0: {onderdeel: "kennis", value: "3"}, .... , 11: {onderdeel: "betrokkenheid", value: "2"}}, "zelfstandigheid" : {0: {...}}}
    // type = niveaus: Object with aggregated scores per onderdeel per uitvalgebied ==> {"competentie": {"kennis": {"maxscore": 6, "niveau": ["text niveau 1", "text niveau 2", ....], "score": 4, "value": "U bezit genoeg kennis"}, "prestatie": {....}, ...., "zelfstandigheid": ....}
    // type = resultgebied: String with chosen gebied for advice (on result page ==> "competentie"
    // type = personality: Object with max en werkelijke score per trait ==> {"emotionele_stabiliteit": {"max": 5, "real": 3}, ......}

    function getSetter() {
        var data = {};
        var setResults = function(type, result) {
            data[type] = result;
        };
        var getResults = function() {
            return data;
        };
        return {
            setResults: setResults,
            getResults: getResults
        };
    }

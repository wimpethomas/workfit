    angular.module('workfit')
        .service('ResponseOptions', getResponseOptions)

    function getResponseOptions() {
        var posvalues = [{
                val: 3,
                label: ['altijd', 'eens']
            }, {
                val: 2,
                label: ['vaak', 'grotendeels eens']
            }, {
                val: 1,
                label: ['soms', 'grotendeels oneens']
            }, {
                val: 0,
                label: ['nooit', 'oneens']
            }
        ];
        var negvalues = [{
                val: 0,
                label: ['altijd', 'eens']
            }, {
                val: 1,
                label: ['vaak', 'grotendeels eens']
            }, {
                val: 2,
                label: ['soms', 'grotendeels oneens']
            }, {
                val: 3,
                label: ['nooit', 'oneens']
            }
        ];
        var posvalues2p = [{
                val: 1,
                label: ['ja']
            }, {
                val: -1,
                label: ['nee']
            }
        ];
        var negvalues2p = [{
                val: -1,
                label: ['ja']
            }, {
                val: 1,
                label: ['nee']
            }
        ];

        return {
            posvalues: posvalues,
            negvalues: negvalues,
            posvalues2p: posvalues2p,
            negvalues2p: negvalues2p,
        }
    }

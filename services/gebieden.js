angular.module('workfit')
.service('Gebieden', getGebieden)

function getGebieden() {
  var gebieden = ['competentie', 'sociale_steun', 'zelfstandigheid', 'vermoeidheid', 'werkdruk', 'gezondheid', 'fysieke_gezondheid'];
  var gebiedsnamenArr = ['competentie', 'sociale steun', 'zelfstandigheid', 'vermoeidheid', 'werkdruk', 'gezondheid', 'lichamelijke klachten'];
  var gebiedsnamen = {
    'competentie': 'competentie',
    'sociale_steun': 'sociale steun',
    'zelfstandigheid': 'zelfstandigheid',
    'vermoeidheid': 'vermoeidheid',
    'werkdruk': 'werkdruk',
    'gezondheid': 'gezondheid',
    'fysieke_gezondheid': 'lichamelijke klachten',
    'functionering': 'functionering'
  };
  var funconderdelen = ['betrokkenheid', 'competentie', 'gezondheid', 'leidinggevende', 'locus_of_control', 'plezier', 'sociale_steun', 'zelfstandigheid'];
  var shIndex = {
    s1: 'Magenta',
    s2: 'Cyaan',
    s3: 'Paars',
    s4: 'Blauw',
    s5: 'Rood',
    s6: 'Roze',
    s7: 'Violet',
    s8: 'Geel',
    s9: 'Oranje',
    s10: 'Groen'
  }
  var onderdelen = {
    'competentie': {
      'ken': 'kennis',
      'inz': 'inzicht',
      'erv': 'ervaring',
      'vtw': 'verantwoording',
      'prs': 'prestatie',
      'bet': 'betrokkenheid'
    },
    'sociale_steun': {
      'vrd': 'vriendschap',
      'bgp': 'begrip',
      'ldg': 'leidinggevende',
      'sor': 'steun_organisatie',
      'sth': 'steun_thuis',
      'ont': 'ontspanning'
    },
    'zelfstandigheid': {
      'hvr': 'handelingsvrijheid',
      'rvr': 'regelvrijheid',
      'avr': 'agendavrijheid',
      'tvr': 'taakvrijheid',
      'bvr': 'beslissingsvrijheid',
      'kvr': 'kennisvrijheid'
    },
    'vermoeidheid': {
      'slp': 'slaappatroon',
      'kwl': 'kwaliteit_leven',
      'eff': 'effecten',
      'ozn': 'oorzaken'
    },
    'werkdruk': {
      'hcj': 'hoogconjunctuur',
      'oat': 'onaantrekkelijkheid',
      'nmt': 'nieuwe_methoden',
      'com': 'complexiteit_voorspelbaarheid',
      'kle': 'klanteneisen',
      'svg': 'schaalvergroting'
    },
    'gezondheid': {
      'mbw': 'milde_beweging',
      'ibw': 'intensieve_beweging',
      'etn': 'eten',
      'drn': 'drinken',
      'ron': 'roken',
      'ald': 'alcohol_drugs'
    },
    'fysieke_gezondheid': {
      'rsi': 'rsi',
      'wdr': 'werkdruk',
      'stw': 'staand_werk',
      'rep': 'repeterende_handelingen',
      'tid': 'tillen_dragen'
    }
  };
  var traitsnamen = {
    'extraversie': 'uitbundigheid',
    'vriendelijkheid': 'vriendelijkheid',
    'zorgvuldigheid': 'zorgvuldigheid',
    'emotionele_stabiliteit': 'emotionele stabiliteit',
    'intellectuele_autonomie': 'openheid'
  };
  return {
    gebieden: gebieden,
    gebiedsnamen: gebiedsnamen,
    gebiedsnamenArr: gebiedsnamenArr,
    traitsnamen: traitsnamen,
    onderdelen: onderdelen,
    funconderdelen: funconderdelen,
    shIndex: shIndex
  };
}

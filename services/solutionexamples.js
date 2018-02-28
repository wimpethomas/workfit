    angular.module('workfit')
        .service('Examples', getExample);

    function getExample() {
        var data = {
            competentie: {
                betrokkenheid: {
                    solution: "Op dit moment voel ik me niet betrokken bij de organisatie en zou ik beter kunnen presteren. Mijn doel is om te gaan kijken hoe ik weer betrokken kan worden bij de organisatie. Hierdoor hoop ik dat mijn wil om te presteren terug komt.",
                    roadmap: ["Ik maak een lijst van wat ik niet leuk vind op het werk. Ik begin met het opschrijven van werkzaamheden waar ik het meeste tegenop zie en eindig met werkzaamheden waar ik het minst tegenop zie.", "Ik bespreek deze lijst met een collega en we zoeken samen naar reden(en) en oplossing(en) voor de vervelende werkzaamheden.", "Ik voer de oplossing uit voor het punt waar ik het meest tegenop zie.", "Ik evalueer hoe de oplossing is gegaan met mijn collega.", "Als de oplossing heeft gewerkt werk ik de rest van de lijst af.", "Ik noteer elke stap die ik heb gemaakt in mijn logboek zodat ik het nog eens kan terug lezen als ik voel dat mijn prestatie weer achteruit gaat."]
                },
                ervaring: {
                    solution: "Ik mis op dit moment ervaring om bepaalde onderdelen van mijn werk goed uit te voeren. Mijn doel is om deze ervaring op te gaan doen zodat ik bekwamer wordt in mijn werk.",
                    roadmap: ["Ik breng in kaart waar ik ervaring in het werk mis, ik beschrijf bij elk punt een collega die in mijn ogen wel de ervaring heeft.", "Ik start bij het punt waar ik het meest tegen aanloop, dit doe ik door een afspraak te maken met de collega.", "Afspraak: ik beschrijf mijn probleem en samen zoeken we naar een oplossing.", "Ik voer de oplossing uit.", "Ik doe hetzelfde met alle ander punten die ik in kaart heb gebracht.", "Ik schrijf het gehele traject op in mijn logboek zodat ik het nog eens kan terug lezen."]
                },
                inzicht: {
                    solution: "Ik mis op dit moment bepaalde kennis om bepaalde onderdelen van mijn werk goed uit te voeren. Mijn doel is om deze kennis te vergaren zodat het werk voor mij inzichtelijker wordt.",
                    roadmap: ["Ik breng in kaart waar ik kennis in het werk mis, ik beschrijf bij elk punt een collega die mij deze kennis zou aan kunnen leren.", "Ik start bij het punt waar ik het meest tegen aanloop, dit doe ik door een afspraak te maken met de collega.", "Afspraak: ik beschrijf mijn probleem en samen zoeken we naar een oplossing.", "Ik voer de oplossing uit.", "Ik doe hetzelfde met alle andere punten die ik in kaart heb gebracht.", "Ik schrijf het gehele traject op in mijn logboek zodat ik het nog eens kan terug lezen."]
                },
                kennis: {
                    alias: "inzicht"
                },
                prestatie: {
                    alias: "betrokkenheid"
                },
                verantwoording: {
                    solution: "Ik neem in het werk niet graag de verantwoordelijkheid op me. Mijn doel is om dit wel te doen, zodat mijn carriere en ik als persoon kan groeien.",
                    roadmap: ["Ik beschrijf minimaal drie taken waar ik verantwoordelijkheid in kon nemen maar dat niet heb gedaan. En waarom ik dat niet heb gedaan. Ik gebruik hierbij mijn persoonlijkheidstest.", "Ik bespreek dit met een collega en vraag haar of zijn mening hierover en we zoeken samen naar een oplossing.", "Ik bedenk waar en bij welke taak ik de oplossing ga inzetten.", "Ik evalueer hoe dit alles is gegaan met mijn collega, ik pas de oplossing aan als dat nodig is.", "Ik beschrijf het gehele traject in mijn logboek zodat ik het nog eens kan terug lezen."]
                }
            },
            sociale_steun: {
                begrip: {
                    solution: "In mijn werk heb ik het gevoel dat ik erop bepaalde momenten alleen voor sta, ik mis de ondersteuning van collega's. Mijn doel is om meer deel uit te maken van de groep zodat ik ondersteuning krijg van mijn collega's als ik die nodig heb.",
                    roadmap: ["Ik bekijk mijn persoonlijkheid.", "Ik zoek een vertrouweling op het werk.", "Gesprek met vertrouweling over het gevoel dat ik heb. We bespreken het gevoel en mijn persoonlijkheid, wat zou een oorzaak of reden kunnen zijn voor het gevoel.", "Lijst opstellen voor ander gedrag wat het gevoel zou kunnen oplossen.", "Beginnen met de lijst, ik kies een kleine aanpassing van gedrag uit.", "Bespreek, na bepaalde tijd, de gedragsverandering met de vertrouweling.", "Bekijk of mijn gedragsverandering invloed heeft op het gevoel dat ik heb.","Verdere aanpassing van mijn gedrag zodat het gevoel totaal weg gaat.","Evalueer met vertrouweling het gehele traject en beschrijf dit in mijn logboek."]
                },
                leidinggevende: {
                    solution: "In mijn werk heb ik het gevoel dat ik erop bepaalde momenten alleen voor sta, ik mis de ondersteuning van mijn leidinggevende. Mijn doel is om een betere relatie met mijn leidinggevende te krijgen zodat ik de ondersteuning krijg die ik nodig heb.",
                    roadmap: ["Ik bekijk mijn persoonlijkheid.", "Ik zoek een vertrouweling op het werk. Ik bespreek het gevoel dat ik heb. Wat zou een oorzaak of reden kunnen zijn voor de slechte relatie? Ik kijk alleen naar wat ik kan veranderen.", "Ik vraag een gesprek aan met mijn leidinggevende en leg mijn bevindingen aan hem of haar voor. We bespreken samen hoe we mijn gevoel kunnen wegnemen.", "Ik pas mijn gedrag aan en kijk een bepaalde periode hoe het gaat.", "Ik evalueer met mijn leidinggevende de periode. We kijken samen hoe het is gegaan.", "Ik beschrijf het gehele traject in mijn logboek."]
                },
                ontspanning: {
                    solution: "Bij thuiskomst ervaar ik geen ontspanning van mijn werk, ik neem de gespannen sfeer van het werk mee naar huis. Mijn doel is om thuis ontspanning te vinden zodat ik het werk achter mij kan laten.",
                    roadmap: ["Ik maak een overzicht van wat ik doe als ik thuis kom. In het overzicht neem ik mee wat ik nog aan het huishouden moet doen, hoe mijn omgang is met mijn partner en wat ik aan sport doe. Ik maak een overzicht voor een week.", "Ik bekijk het overzicht en zoek naar de oorzaak. Voor de oorzaak zoek ik een oplossing.", "Ik voer de oplossing uit voor een bepaalde periode.", "Ik evalueer de periode. Is er meer ontspanning gekomen?", "Als dit niet het geval is dan begin ik weer bij stap 2.", "Ik beschrijf de oplossing in mijn logboek."]
                },
                steun_organisatie: {
                    solution: "Op het werk weet ik niet zo goed wat de activiteiten van onze ondersteunende afdelingen (PO, HRM, enz) zijn, het is dan ook lastig om te bepalen waar deze afdelingen mij in kunnen ondersteunen. Mijn doel is om optimaal gebruik te maken van deze afdelingen. Ik ga dit onderzoeken.",
                    roadmap: ["Ik zoek naar informatie waar in staat beschreven wat de ondersteunende afdeling precies doet. Ik maak een lijst met punten die voor mij van toegevoegde waarde zijn.", "Ik vraag een gesprek aan met mijn leidinggevende. In dit gesprek bespreek ik de punten die ik heb gevonden en kaart ik aan waar ik gebruik van zou willen maken.", "Ik stel een mail op voor de ondersteunende afdeling, in de mail beschrijf ik welke hulp ik nodig heb en waarom. Als ik het meer persoonlijk wil houden dan vraag ik een gesprek aan.", "Ik zet de lijst met punten die ik heb gemaakt bij mijn kleine onderzoekje in mijn logboek."]
                },
                steun_thuis: {
                    alias: "ontspanning"
                },
                vriendschap: {
                    alias: "begrip"
                }
            },
            werkdruk: {
                complexiteit_voorspelbaarheid: {
                    solution: "Het werk wordt steeds complexer (onvoorspelbaar) waardoor ik het allemaal niet meer goed overzie. Mijn doel is om structuur in het werk te gaan brengen, wat ook beter past bij mijn persoonlijkheid. Hierdoor zal het werk weer overzichtelijk worden.",
                    roadmap: ["Ik maak een lijst van mijn werk. Ik beschrijf wat ik moet doen, wanneer en hoe.", "Ik maak een tijdsindeling van hoe mijn werk er nu uitziet.", "Ik maak een plan van aan aanpak voor mijn werk, dit doe ik voor een week. Ik maak een nieuwe tijdsindeling waar er meer structuur is in het werk. Naast de tijdsindeling beschrijf ik wat ik moet doen en hoe ik dat ga doen.", "Ik evalueer hoe de week is verlopen, is er meer structuur gekomen?", "Ik schrijf de stappen op in mijn logboek."]
                },
                hoogconjunctuur: {
                    solution: "De organisatie is de laatste tijd erg gegroeid, met deze groei zijn er meer regels gekomen. Ik heb hier last van omdat ik minder vrijheid geniet in het werk. Mijn doel is om meer vrijheid te creeren in het werk zodat ik de groei beter aankan. Ik werk namelijk beter en sneller als er minder regels zijn.",
                    roadmap: ["Ik beschrijf alle regels die mij belemmeren om mijn werk goed uit te voeren.", "Ik bespreek deze regels met een collega en vraag naar zijn mening.", "Met beide bevindingen ga ik naar mijn leidinggevende en bespreek waar ik tegen aanloop. We gaan samen opzoek naar een oplossing.", "Ik voer de oplossing uit.", "Ik evalueer het traject en ga terug naar stap 1 als dat nodig is.", "Ik beschrijf het traject in mijn logboek."]
                },
                klanteneisen: {
                    solution: "De laatste tijd worden klanten veeleisender en mondiger. Ik ondervind hier hinder van. Mijn doel is om aan de klanten hun wensen te voldoen. Ik wil namelijk mijn werk zorgvuldig doen.",
                    roadmap: ["Ik breng in kaart wat de klanten als grootste probleem ervaren. Ik doe dit door een enquete af te nemen bij de klanten.", "Ik maak een analyse van de enquete, ik zoek het grootste probleem.", "Ik presenteer mijn bevindingen aan mijn leidinggevende en we gaan samen naar een oplossing zoeken.", "Ik voer de oplossing uit.", "Ik evalueer het traject, help ik de klanten zo dat ik tevreden ben met mijn werk.", "Ik beschrijf het gehele traject in mijn logboek."]
                },
                nieuwe_methoden: {
                    alias: "complexiteit_voorspelbaarheid"
                },
                onaantrekkelijkheid: {
                    solution: "Het werk is op dit moment onaantrekkelijk voor mij, er is teveel structuur waardoor ik weinig vrijheid geniet in het werk. Mijn doel is om meer vrijheid te creëren in het werk. Ik hoop hierdoor het werk weer aantrekkelijker te maken.",
                    roadmap: ["Gesprek aanvragen met leidinggevende. Ik geef aan waar ik tegen aanloop en vraag een uitleg voor de structuur die nu gevolgd wordt. We zoeken samen naar oplossing voor vermindering van die structuur.", "Oplossing uitvoeren.", "Ik evalueer de oplossing met mijn leidinggevende. Hoe gaat het en vooral hoe beleven we het beiden. Is er een negatief antwoord gaan we terug naar stap 1.", "Ik beschrijf het gehele traject in mijn logboek."]
                },
                schaalvergroting: {
                    alias: "hoogconjunctuur"
                }
            },
            zelfstandigheid: {
                agendavrijheid: {
                    solution: "Ik heb moeite met goed werk af te leveren omdat ik beperkt wordt in mijn vrijheid op het werk. Mijn doel is om mijn taken meer zelf in te mogen vullen. Ik hoop hiermee ook mijn prestatie omhoog te gooien.",
                    roadmap: ["Gesprek aanvragen met leidinggevende. Ik geef aan waar ik tegen aanloop en vraag een uitleg waarom de taken zo vast staan in uitvoering. We zoeken samen naar oplossing om dit te veranderen.", "Oplossing uitvoeren.", "Ik evalueer de oplossing met mijn leidinggevende. Hoe gaat het en vooral hoe beleven we het beiden. Is er een negatief antwoord gaan we terug naar stap 1.", "Ik beschrijf het gehele traject in mijn logboek."]
                },
                beslissingsvrijheid: {
                    solution: "Ik voel me geremd in mijn creativiteit op het werk, dit komt omdat ik weinig beslissingen mag nemen hoe ik mijn werk uitvoer. Mijn doel is om zelf te mogen beslissen hoe ik mijn werk doe. Mijn creativiteit zal dan beter tot zijn recht komen.",
                    roadmap: ["Ik neem een taak van mijn werk, ik maak een plan hoe ik de taak zou uitvoeren. Als ik alle verantwoordelijkheid voor de taak zou hebben.", "Ik overleg dit plan met een collega en vraag op- en aanmerkingen.", "Ik vraag een gesprek met mijn leidinggevende aan en presenteer mijn plan. Tevens vraag ik toestemming om de taak zo uit te voeren.", "Ik voer het plan uit.", "Ik evalueer het plan en stel het zo nodig bij.", "Ik beschrijf het traject in mijn logboek."]
                },
                handelingsvrijheid: {
                    solution: "Ik heb in het werk een strakke structuur waar ik niet van af mag wijken. Dit geeft mij een beklemmend gevoel. Mijn doel is om dit gevoel weg te nemen. Ik doe dit door een oplossing te zoeken voor de structuur die mij zo beklemd.",
                    roadmap: ["Ik beschrijf de structuur, ik maak een plan hoe ik deze structuur zou kunnen veranderen.", "Ik overleg dit plan met een collega en vraag op- en aanmerkingen.", "Ik vraag een gesprek met mijn leidinggevende aan en presenteer mijn plan. Tevens vraag ik toestemming om mijn werk volgens de structuur van mijn plan uit te mogen voeren.", "Ik voer het plan uit.", "Ik evalueer het plan en stel het zo nodig bij.", "Ik beschrijf het traject in mijn logboek."]
                },
                kennisvrijheid: {
                    alias: "beslissingsvrijheid"
                },
                regelvrijheid: {
                    alias: "handelingsvrijheid"
                },
                taakvrijheid: {
                    alias: "agendavrijheid"
                }
            },
            fysieke_gezondheid: {
                repeterende_handelingen: {
                    solution: "Door herhaalde bewegingen op het werk ben ik rsi klachten gaan ervaren. Mijn doel is om na een bepaalde periode vrij te zijn van klachten. Dit doe ik door naar oplossingen te zoeken die mijn rsi klachten laten verdwijnen.",
                    roadmap: ["Ik bekijk mijn werkzaamheden en zoek naar de oorzaken van mijn klachten. Bij elke oorzaak bedenk ik een oplossing.", "Ik vraag een gesprek aan met mijn leidinggevende, ik vraag hierbij zijn hulp voor de oplossingen die ik heb bedacht.", "Ik voer de oplossingen uit en bekijk, na een bepaalde periode, of mijn klachten af zijn genomen. Is dit niet het geval dan begin ik weer bij stap 1.", "Als alle klachten zijn verdwenen dan beschrijf ik de route die ik heb afgelegd in mijn logboek."]
                },
                rsi: {
                    alias: "repeterende_handelingen"
                },
                staand_werk: {
                    solution: "Doordat ik veel staand werk doe ervaar ik bepaalde fysieke klachten. Mijn doel is om na een bepaalde periode vrij te zijn van klachten. Dit doe ik door naar een andere indeling van mijn werk te zoeken zodat ik minder vaak stil hoef te staan.",
                    roadmap: ["Ik bekijk mijn werkzaamheden en zoek naar oplossingen waar ik minder lang achter elkaar hoef te staan.", "Ik vraag een gesprek aan met mijn leidinggevende, ik vraag hierbij zijn hulp, en misschien zijn toestemming, voor de oplossingen die ik heb bedacht.", "Ik voer de oplossingen uit en bekijk, na een bepaalde periode, of mijn klachten af zijn genomen. Is dit niet het geval dan begin ik weer bij stap 1.", "Als alle klachten zijn verdwenen dan beschrijf ik de route die ik heb afgelegd in mijn logboek."]
                },
                tillen_dragen: {
                    alias: "staand_werk"
                },
                werkdruk: {
                    solution: "Doordat mijn werkdruk erg hoog is ervaar ik fysieke klachten. Om achter de precieze oorzaken van mijn klachten te komen maak ik de test over werkdruk. Via deze test kan ik met de resultaten verder aan de gang met mijn klachten.",
                    roadmap: ["Werksituatie: Ik bekijk mijn werkzaamheden en zoek naar de oorzaken van mijn klachten.", "Verandering: Als ik achter de oorzaken ben gekomen ga ik opzoek naar een oplossing voor mijn probleem, dit zou een andere muis kunnen zijn.", "Gesprek: Ik ga met mijn leidinggevende in gesprek om werkspullen te kunnen aanschaffen zodat de oorzaak wordt opgelost.", "Evaluatie: Na een bepaalde periode ga ik kijken of alle klachten weg zijn, is dit niet het geval dan ga ik weer opzoek naar wat de klachten kunnen veroorzaken.", "Afronding: Als alle klachten zijn verdwenen dan beschrijf ik de route die ik heb afgelegd in mijn logboek."]
                }
            },
            gezondheid: {
                alcohol_drugs: {
                    solution: "Ik rook en voel dat mijn gezondheid hierdoor achteruit gaat. Mijn doel is om te stoppen met roken.",
                    roadmap: ["Ik noteer al de ongemakken die ik ondervind van het roken.", "Ik zoek hulp voor het stoppen met roken. Ik vraag een vriend om hulp zodat ik kan praten over problemen als ik die ervaar.", "Ik stop nu met roken, ik gooi of geef al mijn sigaretten weg.", "Als ik het moeilijk krijg en de behoefte om te roken weer opsteekt zoek ik hulp en praat ik over deze behoefte.", "Ik merk dat ik ondanks de gesprekken de behoefte hou om te roken.", "Ik maak een afspraak met de dokter en vraag professionele hulp met het stoppen."]
                },
                drinken: {
                    solution: "Ik zit niet lekker in mijn vel, ik voel me moe overdag en heb overgewicht. Mijn doel is om beter te gaan eten zodat ik ten eerste wat afval en meer energie krijg.",
                    roadmap: ["Ik schrijf op wat ik eet op een dag, dit hou ik een week bij.", "Ik bekijk de lijst met eten en drinken en stel een eet schema op wat een gezonder karakter heeft.", "Ik ga aan de slag met mijn schema, ik doe dit 1 week.", "Ik evalueer de week. Heb ik het schema in zijn geheel gevolgd? Heb ik meer energie gekregen? Ik pas zo nodig het schema aan.", "Ik hou mij aan het schema voor 1 maand.", "Ik evalueer de maand, ben ik tevreden dan beschrijf ik het gehele traject in mijn logboek. Ben ik niet tevreden dan begin ik weer bij stap 4."]
                },
                eten: {
                    alias: "drinken"
                },
                intensieve_beweging: {
                    solution: "Ik vind dat ik te weinig beweeg de laatste tijd, hierdoor heb ik weinig energie. Mijn doel is om meer te gaan bewegen. Dit moet als effect geven dat ik overdag meer energie heb.",
                    roadmap: ["Ik bekijk mijn indeling van de week, ik ga opzoek naar momenten waar ik meer kan bewegen. Dit door te sporten of door andere keuzes te maken zoals de trap te nemen ipv de lift.", "Ik stel, voor een week, per dag een schema op waar ik meer beweging ga zoeken.", "Ik ga aan de slag met mijn schema aan de slag, ik doe dit minimaal twee weken.", "Ik evalueer mijn schema en pas aan waar nodig.", "Ik beschrijf het gehele traject in mijn logboek."]
                },
                milde_beweging: {
                    alias: "intensieve_beweging"
                },
                roken: {
                    alias: "alcohol_drugs"
                }
            },
            vermoeidheid: {
                effecten: {
                    solution: "Ik ben de laatste tijden vermoeid, afwezig en niet geconcentreerd overdag, dit heeft te maken met een slechte nachtrust. Mijn nachtrust is namelijk niet lang genoeg en wordt vaak onderbroken. Ik wil hier verandering in brengen zodat ik weer een normale nachtrust heb.",
                    roadmap: ["Ik ga de slaap hygiene regels bekijken. Als ik aan bepaalde regels nog niet voldoe ga ik deze toepassen voor een bepaalde periode.", "Ik evalueer de periode, ik merk dat het slapen beter is geworden.", "Ik beschrijf de slaap hygiëne regels en de oplossing in mijn logboek."]
                },
                kwaliteit_leven: {
                    alias: "effecten"
                },
                oorzaken: {
                    alias: "effecten"
                },
                slaappatroon: {
                    alias: "effecten"
                },
            }
        };

        var solutionSentence = {
            competentie: 'Verzin een oplossing die je meer competent in het werk kan maken.',
            sociale_steun: 'Verzin een oplossing die leidt tot meer steun van je familie en vrienden.',
            werkdruk: 'Verzin een oplossing die de werkdruk vermindert of je beter laat omgaan met de bestaande werkdruk.',
            zelfstandigheid: 'Verzin een oplossing die je zelfstandigheid in je werkt vergroot.',
            fysieke_gezondheid: 'Verzin een oplossing die je fysieke gesteldheid verbetert.',
            gezondheid: 'Verzin een oplossing die je algemene gezondheid verbetert.',
            vermoeidheid: 'Verzin een oplossing die leidt tot een minder vermoeid gevoel.'
        }

        var getByGebied = function(gebied, onderdeel) {
            var resultSet = data[gebied][onderdeel];
            return resultSet;
        };

        var getSolutionSentence = function(gebied) {
            var result = solutionSentence[gebied];
            return result;
        };

        return {
            getByGebied: getByGebied,
            getSolutionSentence: getSolutionSentence
        }
    }

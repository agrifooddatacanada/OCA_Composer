const json = [
  {
    id: 1,
    name: {
      en: "Canadian Provinces",
      fr: "Provinces canadiennes"
    },
    description: {
      en: "List of Canadian provinces and their codes",
      fr: "Liste des provinces canadiennes et leurs codes"
    },
    keywords: {
      en: ["canada", "province", "geography"],
      fr: ["Canada", "province", "géographie"]
    },
    category: "general",
    source: "",
    languages: ["en", "fr"],
    headers: ["Code", "en", "fr"],
    rows: [
      {
        Code: "AB",
        en: "Alberta",
        fr: "L'Alberta"
      },
      {
        Code: "BC",
        en: "British Columbia",
        fr: "La Colombie-Britannique"
      },
      {
        Code: "MB",
        en: "Manitoba",
        fr: "Le Manitoba"
      },
      {
        Code: "NB",
        en: "New Brunswick",
        fr: "Le Nouveau-Brunswick"
      },
      {
        Code: "NL",
        en: "Newfoundland and Labrador",
        fr: "La Terre-Neuve-et-Labrador"
      },
      {
        Code: "NS",
        en: "Nova Scotia",
        fr: "La Nouvelle-Écosse"
      },
      {
        Code: "NT",
        en: "Northwest Territories",
        fr: "Les Territoires du Nord-Ouest"
      },
      {
        Code: "NU",
        en: "Nunavut",
        fr: "Le Nunavut"
      },
      {
        Code: "ON",
        en: "Ontario",
        fr: "L'Ontario"
      },
      {
        Code: "PE",
        en: "Prince Edward Island",
        fr: "Île-du-Prince-Édouard"
      },
      {
        Code: "QC",
        en: "Quebec",
        fr: "Le Québec"
      },
      {
        Code: "SK",
        en: "Saskatchewan",
        fr: "La Saskatchewan"
      },
      {
        Code: "YT",
        en: "Yukon",
        fr: "Le Yukon"
      }
    ]
  },
  {
    id: 2,
    name: {
      en: "days",
      fr: "jours"
    },
    description: {
      en: "Days of the week",
      fr: "Jours de la semaine"
    },
    keywords: {
      en: [],
      fr: []
    },
    category: "general",
    source: "",
    languages: ["en", "fr"],
    headers: ["Code", "en", "fr"],
    rows: [
      {
        Code: "Mon",
        en: "Monday",
        fr: "Lundi"
      },
      {
        Code: "Tues",
        en: "Tuesday",
        fr: "Mardi"
      },
      {
        Code: "Wed",
        en: "Wednesday",
        fr: "Mercredi"
      },
      {
        Code: "Thurs",
        en: "Thursday",
        fr: "Jeudi"
      },
      {
        Code: "Fri",
        en: "Friday",
        fr: "Vendredi"
      },
      {
        Code: "Sat",
        en: "Saturday",
        fr: "Samedi"
      },
      {
        Code: "Sun",
        en: "Sunday",
        fr: "Dimanche"
      }
    ]
  },
  {
    id: 3,
    name: {
      en: "Eight Point Cardinality",
      fr: "Cardinalité à huit points"
    },
    description: {
      en: "The 8‑wind compass rose consists of the four cardinal directions—north (N), east (E), south (S), and west (W)—arranged at 90‑degree intervals. By bisecting each of these angles, four intercardinal directions are formed: northeast (NE), southeast (SE), southwest (SW), and northwest (NW). Altogether, these eight points provide a simple directional framework commonly used in navigation and maps.",
      fr: "La rose des vents à huit points cardinaux se compose des quatre directions cardinales — nord (N), est (E), sud (S) et ouest (O) — disposées à intervalles de 90 degrés. La bissectrice de chacun de ces angles forme les quatre directions intermédiaires : nord-est (NE), sud-est (SE), sud-ouest (SO) et nord-ouest (NO). Ces huit points constituent un système d’orientation simple, couramment utilisé en navigation et en cartographie."
    },
    keywords: {
      en: [],
      fr: []
    },
    category: "general",
    source: "",
    languages: ["en", "fr"],
    headers: ["Code", "en", "fr"],
    rows: [
      {
        Code: "N",
        en: "North",
        fr: "Nord"
      },
      {
        Code: "NE",
        en: "Northeast",
        fr: "Nord-Est"
      },
      {
        Code: "E",
        en: "East",
        fr: "Est"
      },
      {
        Code: "SE",
        en: "Southeast",
        fr: "Sud-Est"
      },
      {
        Code: "S",
        en: "South",
        fr: "Sud"
      },
      {
        Code: "SW",
        en: "Southwest",
        fr: "Sud-Ouest"
      },
      {
        Code: "W",
        en: "West",
        fr: "Ouest"
      },
      {
        Code: "NW",
        en: "Northwest",
        fr: "Nord-Ouest"
      }
    ]
  },
  {
    id: 4,
    name: {
      en: "months",
      fr: "mois"
    },
    description: {
      en: "Months of the year",
      fr: "Mois de l'année"
    },
    keywords: {
      en: ["date", "calendar", "month"],
      fr: ["date", "calendrier", "mois"]
    },
    category: "general",
    source: "",
    languages: ["en", "fr"],
    headers: ["Code", "en", "fr"],
    rows: [
      {
        Code: "Jan",
        en: "January",
        fr: "janvier"
      },
      {
        Code: "Feb",
        en: "February",
        fr: "février"
      },
      {
        Code: "Mar",
        en: "March",
        fr: "mars"
      },
      {
        Code: "Apr",
        en: "April",
        fr: "avril"
      },
      {
        Code: "May",
        en: "May",
        fr: "mai"
      },
      {
        Code: "Jun",
        en: "June",
        fr: "juin"
      },
      {
        Code: "Jul",
        en: "July",
        fr: "juillet"
      },
      {
        Code: "Aug",
        en: "August",
        fr: "août"
      },
      {
        Code: "Sep",
        en: "September",
        fr: "septembre"
      },
      {
        Code: "Oct",
        en: "October",
        fr: "octobre"
      },
      {
        Code: "Nov",
        en: "November",
        fr: "novembre"
      },
      {
        Code: "Dec",
        en: "December",
        fr: "décembre"
      }
    ]
  },
  {
    id: 5,
    name: {
      en: "Parent material chemical property",
      fr: "Propriété chimique du matériau parental"
    },
    description: {
      en: "The chemical composition class of the parent material.",
      fr: "La classe de composition chimique du matériau parental."
    },
    keywords: {
      en: [],
      fr: []
    },
    category: "general",
    source: "https://sis.agr.gc.ca/cansis/nsdb/soil/v2/snt/pmchem1.html",
    languages: ["en", "fr"],
    headers: ["Code", "en", "fr"],
    rows: [
      {
        Code: "UD",
        en: "Undifferentiated",
        fr: "Indifférencié"
      },
      {
        Code: "EA",
        en: "Extremely / Strongly Acidic",
        fr: "Extrêmement / fortement acide"
      },
      {
        Code: "AN",
        en: "Medium Acid to Neutral",
        fr: "Acide moyen à neutre"
      },
      {
        Code: "WC",
        en: "Weakly Calcareous",
        fr: "Faiblement calcaire"
      },
      {
        Code: "VC",
        en: "Moderately / Very Strongly Calcareous",
        fr: "Modérément / très fortement calcaire"
      },
      {
        Code: "EC",
        en: "Extremely Calcareous",
        fr: "Extrêmement calcaire"
      },
      {
        Code: "SA",
        en: "Calcareous and Saline",
        fr: "Calcaire et salin"
      },
      {
        Code: "-",
        en: "Not Applicable",
        fr: "Sans objet"
      }
    ]
  },
  {
    id: 6,
    name: {
      en: "Parent material texture",
      fr: "Texture du matériau parental"
    },
    description: {
      en: "The texture class of the underlying parent material.",
      fr: "La classe de texture du matériau parental sous-jacent."
    },
    keywords: {
      en: [],
      fr: []
    },
    category: "general",
    source: "https://sis.agr.gc.ca/cansis/nsdb/soil/v2/snt/pmtex1.html",
    languages: ["en", "fr"],
    headers: ["Code", "en", "fr"],
    rows: [
      {
        Code: "VC",
        en: "Very Coarse",
        fr: "Très grossier"
      },
      {
        Code: "C",
        en: "Coarse",
        fr: "Grossier"
      },
      {
        Code: "MC",
        en: "Moderately Coarse",
        fr: "Modérément grossier"
      },
      {
        Code: "M",
        en: "Medium",
        fr: "Moyen"
      },
      {
        Code: "MF",
        en: "Moderately Fine",
        fr: "Modérément fin"
      },
      {
        Code: "F",
        en: "Fine",
        fr: "Fin"
      },
      {
        Code: "VF",
        en: "Very Fine",
        fr: "Très fin"
      },
      {
        Code: "CS",
        en: "Coarse Skeletal",
        fr: "Grossier squelettique"
      },
      {
        Code: "MS",
        en: "Medium Skeletal",
        fr: "Moyen squelettique"
      },
      {
        Code: "FS",
        en: "Fine Skeletal",
        fr: "Fin squelettique"
      },
      {
        Code: "FR",
        en: "Fragmental",
        fr: "Fragmentaire"
      },
      {
        Code: "SM",
        en: "Stratified (Mineral)",
        fr: "Stratifié (minéral)"
      },
      {
        Code: "SU",
        en: "Stratified (Mineral and Organic)",
        fr: "Stratifié (minéral et organique)"
      },
      {
        Code: "FI",
        en: "Fibric",
        fr: "Fibrique"
      },
      {
        Code: "ME",
        en: "Mesic",
        fr: "Mésique"
      },
      {
        Code: "HU",
        en: "Humic",
        fr: "Humique"
      },
      {
        Code: "UD",
        en: "Undifferentiated",
        fr: "Indifférencié"
      },
      {
        Code: "-",
        en: "Not Applicable",
        fr: "Sans objet"
      }
    ]
  },
  {
    id: 7,
    name: {
      en: "Sixteen Point Cardinality",
      fr: "Cardinalité à seize points"
    },
    description: {
      en: "The 16‑wind compass rose expands on the 8‑point system by adding eight half‑winds. These are created by bisecting each 45‑degree angle between the cardinal and intercardinal points. The added directions are: north‑northeast (NNE), east‑northeast (ENE), east‑southeast (ESE), south‑southeast (SSE), south‑southwest (SSW), west‑southwest (WSW), west‑northwest (WNW), and north‑northwest (NNW). This system provides more precise directional reference at 22.5‑degree increments.",
      fr: "La rose des vents à 16 points cardinaux complète la rose des vents à 8 points en ajoutant huit demi-vents. Ces derniers sont obtenus en bissectant chaque angle de 45 degrés entre les points cardinaux et intermédiaires. Les directions ajoutées sont : nord-nord-est (NNE)"
    },
    keywords: {
      en: [],
      fr: ["est-nord-est (ENE)"]
    },
    category: "general",
    source: "est-sud-est (ESE)",
    languages: ["en", "fr"],
    headers: ["Code", "en", "fr"],
    rows: [
      {
        Code: "N",
        en: "North",
        fr: "Nord"
      },
      {
        Code: "NNE",
        en: "North-Northeast",
        fr: "Nord-Nord-Est"
      },
      {
        Code: "NE",
        en: "Northeast",
        fr: "Nord-Est"
      },
      {
        Code: "ENE",
        en: "East-Northeast",
        fr: "Est-Nord-Est"
      },
      {
        Code: "E",
        en: "East",
        fr: "Est"
      },
      {
        Code: "ESE",
        en: "East-Southeast",
        fr: "Est-Sud-Est"
      },
      {
        Code: "SE",
        en: "Southeast",
        fr: "Sud-Est"
      },
      {
        Code: "SSE",
        en: "South-Southeast",
        fr: "Sud-Sud-Est"
      },
      {
        Code: "S",
        en: "South",
        fr: "Sud"
      },
      {
        Code: "SSW",
        en: "South-Southwest",
        fr: "Sud-Sud-Ouest"
      },
      {
        Code: "SW",
        en: "Southwest",
        fr: "Sud-Ouest"
      },
      {
        Code: "WSW",
        en: "West-Southwest",
        fr: "Ouest-Sud-Ouest"
      },
      {
        Code: "W",
        en: "West",
        fr: "Ouest"
      },
      {
        Code: "WNW",
        en: "West-Northwest",
        fr: "Ouest-Nord-Ouest"
      },
      {
        Code: "NW",
        en: "Northwest",
        fr: "Nord-Ouest"
      },
      {
        Code: "NNW",
        en: "North-Northwest",
        fr: "Nord-Nord-Ouest"
      }
    ]
  },
  {
    id: 8,
    name: {
      en: "en",
      fr: "fr"
    },
    description: {
      en: "Soil aeration status",
      fr: "Statut d’aération du sol"
    },
    keywords: {
      en: ["Qualitative oxygen availability status."],
      fr: ["Statut qualitatif de disponibilité en oxygène."]
    },
    category: "general",
    source:
      "https://static.ixambee.com/public/miscellaneous-pdf/physical_and_chemical_properties_of_soil1720241418.pdf",
    languages: ["en", "fr"],
    headers: ["Code", "en", "fr"],
    rows: [
      {
        Code: "AERW",
        en: "Well-aerated",
        fr: "Bien aéré"
      },
      {
        Code: "AERM",
        en: "Moderately aerated",
        fr: "Modérément aéré"
      },
      {
        Code: "AERP",
        en: "Poorly aerated (anaerobic)",
        fr: "Mal aéré (anaérobie)"
      }
    ]
  },
  {
    id: 9,
    name: {
      en: "en",
      fr: "fr"
    },
    description: {
      en: "Bulk density class",
      fr: "Classe de densit� apparente"
    },
    keywords: {
      en: ["Generalized classes; specific restrictive thresholds depend on texture."],
      fr: ["Classes g�n�ralis�es; les seuils restrictifs d�pendent de la texture."]
    },
    category: "general",
    source: "https://soilquality.nres.illinois.edu/bulk-density/",
    languages: ["en", "fr"],
    headers: ["Code", "en", "fr"],
    rows: [
      {
        Code: "BDL",
        en: "Low",
        fr: "Faible"
      },
      {
        Code: "BDM",
        en: "Moderate",
        fr: "Mod�r�"
      },
      {
        Code: "BDH",
        en: "High",
        fr: "�lev�"
      }
    ]
  },
  {
    id: 10,
    name: {
      en: "en",
      fr: "fr"
    },
    description: {
      en: "Carbon-to-Nitrogen (C:N) ratio class",
      fr: "Classe du rapport carbone-azote (C:N)"
    },
    keywords: {
      en: ["C:N ratio categories."],
      fr: ["Catégories de C:N."]
    },
    category: "general",
    source:
      "https://ucanr.edu/?legacy-file=29072.pdf&legacy-file-path=sites/gardenweb/files/",
    languages: ["en", "fr"],
    headers: ["Code", "en", "fr"],
    rows: [
      {
        Code: "CNL",
        en: "Low",
        fr: "Faible"
      },
      {
        Code: "CNM",
        en: "Medium",
        fr: "Moyen"
      },
      {
        Code: "CNH",
        en: "High",
        fr: "Élevé"
      }
    ]
  },
  {
    id: 11,
    name: {
      en: "en",
      fr: "fr"
    },
    description: {
      en: "Soil colloid fraction class",
      fr: "Classe de fraction colloïdale du sol"
    },
    keywords: {
      en: ["Relative abundance of colloids."],
      fr: ["Abondance relative des colloïdes."]
    },
    category: "general",
    source:
      "https://lecture-notes.tiu.edu.iq/wp-content/uploads/2025/03/BIO212_W6_Lect.6_2024-2025.pdf",
    languages: ["en", "fr"],
    headers: ["Code", "en", "fr"],
    rows: [
      {
        Code: "COLL",
        en: "Low",
        fr: "Faible"
      },
      {
        Code: "COLM",
        en: "Medium",
        fr: "Moyenne"
      },
      {
        Code: "COLH",
        en: "High",
        fr: "Élevée"
      }
    ]
  },
  {
    id: 12,
    name: {
      en: "en",
      fr: "fr"
    },
    description: {
      en: "Soil compressibility class",
      fr: "Classe de compressibilité du sol"
    },
    keywords: {
      en: ["Relative compressibility category."],
      fr: ["Catégorie de compressibilité relative."]
    },
    category: "general",
    source:
      "https://www.biologydiscussion.com/soil/physical-and-chemical-properties-of-soil/7220",
    languages: ["en", "fr"],
    headers: ["Code", "en", "fr"],
    rows: [
      {
        Code: "CMPL",
        en: "Low",
        fr: "Faible"
      },
      {
        Code: "CMPM",
        en: "Moderate",
        fr: "Modérée"
      },
      {
        Code: "CMPH",
        en: "High",
        fr: "Élevée"
      }
    ]
  },
  {
    id: 13,
    name: {
      en: "Soil Drainage Class",
      fr: "Classe de drainage du sol"
    },
    description: {
      en: "Indicates the type of drainage found within a soil profile.",
      fr: "Indique le type de drainage présent dans un profil de sol."
    },
    keywords: {
      en: [],
      fr: []
    },
    category: "general",
    source: "https://sis.agr.gc.ca/cansis/nsdb/soil/v2/snt/drainage.html",
    languages: ["en", "fr"],
    headers: ["Code", "en", "fr"],
    rows: [
      {
        Code: "VR",
        en: "Very rapidly drained",
        fr: "Très rapidement drainé"
      },
      {
        Code: "R",
        en: "Rapidly drained",
        fr: "Rapidement drainé"
      },
      {
        Code: "W",
        en: "Well drained",
        fr: "Bien drainé"
      },
      {
        Code: "MW",
        en: "Moderately well drained",
        fr: "Modérément bien drainé"
      },
      {
        Code: "I",
        en: "Imperfectly drained",
        fr: "Imperfectement drainé"
      },
      {
        Code: "P",
        en: "Poorly drained",
        fr: "Mal drainé"
      },
      {
        Code: "VP",
        en: "Very poorly drained",
        fr: "Très mal drainé"
      },
      {
        Code: "-",
        en: "Not applicable",
        fr: "Sans objet"
      }
    ]
  },
  {
    id: 14,
    name: {
      en: "",
      fr: ""
    },
    description: {
      en: "",
      fr: ""
    },
    keywords: {
      en: [],
      fr: []
    },
    category: "en",
    source: "",
    languages: ["en", "fr"],
    headers: ["Code", "en", "fr"],
    rows: [
      {
        Code: "RDVS",
        en: "Very shallow",
        fr: "Très faible profondeur"
      },
      {
        Code: "RDSH",
        en: "Shallow",
        fr: "Peu profond"
      },
      {
        Code: "RDM",
        en: "Moderate",
        fr: "Modéré"
      },
      {
        Code: "RDD",
        en: "Deep",
        fr: "Profond"
      },
      {
        Code: "RDVD",
        en: "Very deep",
        fr: "Très profond"
      }
    ]
  },
  {
    id: 15,
    name: {
      en: "en",
      fr: "fr"
    },
    description: {
      en: "Soil erodibility class",
      fr: "Classe d’érodibilité du sol"
    },
    keywords: {
      en: ["Susceptibility to erosion (qualitative)."],
      fr: ["Susceptibilité à l’érosion (qualitative)."]
    },
    category: "general",
    source:
      "https://www.biologydiscussion.com/soil/physical-and-chemical-properties-of-soil/7220",
    languages: ["en", "fr"],
    headers: ["Code", "en", "fr"],
    rows: [
      {
        Code: "ERL",
        en: "Low",
        fr: "Faible"
      },
      {
        Code: "ERM",
        en: "Moderate",
        fr: "Modérée"
      },
      {
        Code: "ERH",
        en: "High",
        fr: "Élevée"
      }
    ]
  },
  {
    id: 16,
    name: {
      en: "en",
      fr: "fr"
    },
    description: {
      en: "Soil fertility class",
      fr: "Classe de fertilité du sol"
    },
    keywords: {
      en: ["General inherent soil fertility."],
      fr: ["Fertilité intrinsèque générale."]
    },
    category: "general",
    source:
      "https://ucanr.edu/?legacy-file=29072.pdf&legacy-file-path=sites/gardenweb/files/",
    languages: ["en", "fr"],
    headers: ["Code", "en", "fr"],
    rows: [
      {
        Code: "FERL",
        en: "Low",
        fr: "Faible"
      },
      {
        Code: "FERM",
        en: "Medium",
        fr: "Moyen"
      },
      {
        Code: "FERH",
        en: "High",
        fr: "Élevé"
      }
    ]
  },
  {
    id: 17,
    name: {
      en: "en",
      fr: "fr"
    },
    description: {
      en: "Soil mineral content type",
      fr: "Type de contenu minéral du sol"
    },
    keywords: {
      en: ["Dominant mineralogical character."],
      fr: ["Caractère minéralogique dominant."]
    },
    category: "general",
    source:
      "https://ucanr.edu/?legacy-file=29072.pdf&legacy-file-path=sites/gardenweb/files/",
    languages: ["en", "fr"],
    headers: ["Code", "en", "fr"],
    rows: [
      {
        Code: "MINQ",
        en: "Quartz-rich",
        fr: "Riche en quartz"
      },
      {
        Code: "MINC",
        en: "Carbonate-rich",
        fr: "Riche en carbonates"
      },
      {
        Code: "MINA",
        en: "Clay-rich",
        fr: "Riche en argiles"
      },
      {
        Code: "MINM",
        en: "Mixed mineralogy",
        fr: "Minéralogie mixte"
      }
    ]
  },
  {
    id: 18,
    name: {
      en: "en",
      fr: "fr"
    },
    description: {
      en: "Soil organic matter class",
      fr: "Classe de matière organique du sol"
    },
    keywords: {
      en: ["Organic matter percentage class."],
      fr: ["Classe de pourcentage de matiÃ¨re organique."]
    },
    category: "general",
    source:
      "https://ucanr.edu/?legacy-file=29072.pdf&legacy-file-path=sites/gardenweb/files/",
    languages: ["en", "fr"],
    headers: ["Code", "en", "fr"],
    rows: [
      {
        Code: "SOMVL",
        en: "Very low",
        fr: "Très faible"
      },
      {
        Code: "SOML",
        en: "Low",
        fr: "Faible"
      },
      {
        Code: "SOMM",
        en: "Moderate",
        fr: "Modéré"
      },
      {
        Code: "SOMH",
        en: "High",
        fr: "Élevé"
      },
      {
        Code: "SOMVH",
        en: "Very high",
        fr: "Très élevé"
      }
    ]
  },
  {
    id: 19,
    name: {
      en: "en",
      fr: "fr"
    },
    description: {
      en: "Soil permeability class",
      fr: "Classe de perméabilité du sol"
    },
    keywords: {
      en: ["Saturated hydraulic conductivity (qualitative classes)."],
      fr: ["Conductivité hydraulique saturée (classes qualitatives)."]
    },
    category: "general",
    source:
      "https://www.biologydiscussion.com/soil/physical-and-chemical-properties-of-soil/7220",
    languages: ["en", "fr"],
    headers: ["Code", "en", "fr"],
    rows: [
      {
        Code: "KPVS",
        en: "Very slow",
        fr: "Très lente"
      },
      {
        Code: "KPS",
        en: "Slow",
        fr: "Lente"
      },
      {
        Code: "KPM",
        en: "Moderate",
        fr: "Modérée"
      },
      {
        Code: "KPR",
        en: "Rapid",
        fr: "Rapide"
      },
      {
        Code: "KPVR",
        en: "Very rapid",
        fr: "Très rapide"
      }
    ]
  },
  {
    id: 20,
    name: {
      en: "en",
      fr: "fr"
    },
    description: {
      en: "Soil pH class",
      fr: "Classe de pH du sol"
    },
    keywords: {
      en: ["Standard NRCS soil pH range classes."],
      fr: ["Plages de pH normalisées (NRCS)"]
    },
    category: "general",
    source: "https://www.nrcs.usda.gov/sites/default/files/2022-10/soil_ph.pdf",
    languages: ["en", "fr"],
    headers: ["Code", "en", "fr"],
    rows: [
      {
        Code: "UA",
        en: "Ultra acidic",
        fr: "Ultra acide"
      },
      {
        Code: "EA",
        en: "Extremely acidic",
        fr: "Extrêmement acide"
      },
      {
        Code: "VSA",
        en: "Very strongly acidic",
        fr: "Très fortement acide"
      },
      {
        Code: "SA",
        en: "Strongly acidic",
        fr: "Fortement acide"
      },
      {
        Code: "MA",
        en: "Moderately acidic",
        fr: "Modérément acide"
      },
      {
        Code: "SLA",
        en: "Slightly acidic",
        fr: "Légèrement acide"
      },
      {
        Code: "NE",
        en: "Neutral",
        fr: "Neutre"
      },
      {
        Code: "SLK",
        en: "Slightly alkaline",
        fr: "Légèrement alcalin"
      },
      {
        Code: "MK",
        en: "Moderately alkaline",
        fr: "Modérément alcalin"
      },
      {
        Code: "SK",
        en: "Strongly alkaline",
        fr: "Fortement alcalin"
      },
      {
        Code: "VSK",
        en: "Very strongly alkaline",
        fr: "Très fortement alcalin"
      }
    ]
  },
  {
    id: 21,
    name: {
      en: "en",
      fr: "fr"
    },
    description: {
      en: "Soil plasticity class",
      fr: "Classe de plasticité du sol"
    },
    keywords: {
      en: ["Plasticity category (Atterberg-related)."],
      fr: ["Catégorie de plasticité (liée aux limites d’Atterberg)."]
    },
    category: "general",
    source:
      "https://www.biologydiscussion.com/soil/physical-and-chemical-properties-of-soil/7220",
    languages: ["en", "fr"],
    headers: ["Code", "en", "fr"],
    rows: [
      {
        Code: "PLAL",
        en: "Low",
        fr: "Faible"
      },
      {
        Code: "PLAM",
        en: "Medium",
        fr: "Moyenne"
      },
      {
        Code: "PLAH",
        en: "High",
        fr: "Élevée"
      }
    ]
  },
  {
    id: 22,
    name: {
      en: "en",
      fr: "fr"
    },
    description: {
      en: "Soil porosity class",
      fr: "Classe de porosité du sol"
    },
    keywords: {
      en: ["Total porosity class."],
      fr: ["Classe de porosité totale"]
    },
    category: "general",
    source:
      "https://www.biologydiscussion.com/soil/physical-and-chemical-properties-of-soil/7220",
    languages: ["en", "fr"],
    headers: ["Code", "en", "fr"],
    rows: [
      {
        Code: "PORVL",
        en: "Very low",
        fr: "Très faible"
      },
      {
        Code: "PORL",
        en: "Low",
        fr: "Faible"
      },
      {
        Code: "PORM",
        en: "Moderate",
        fr: "Modérée"
      },
      {
        Code: "PORH",
        en: "High",
        fr: "Élevée"
      },
      {
        Code: "PORVH",
        en: "Very high",
        fr: "Très élevée"
      }
    ]
  },
  {
    id: 23,
    name: {
      en: "en",
      fr: "fr"
    },
    description: {
      en: "Soil salinity type (dominant anion)",
      fr: "Type de salinité du sol (anion dominant)"
    },
    keywords: {
      en: ["Dominant salt type in saline conditions."],
      fr: ["Type de sel dominant en conditions salines."]
    },
    category: "general",
    source:
      "https://ucanr.edu/?legacy-file=29072.pdf&legacy-file-path=sites/gardenweb/files/",
    languages: ["en", "fr"],
    headers: ["Code", "en", "fr"],
    rows: [
      {
        Code: "STCL",
        en: "Chloride-dominated",
        fr: "À dominante chlorure"
      },
      {
        Code: "STSO",
        en: "Sulfate-dominated",
        fr: "À dominante sulfate"
      },
      {
        Code: "STCB",
        en: "Carbonate/bicarbonate-dominated",
        fr: "À dominante carbonate/bicarbonate"
      },
      {
        Code: "STMX",
        en: "Mixed salts",
        fr: "Mélange de sels"
      }
    ]
  },
  {
    id: 24,
    name: {
      en: "en",
      fr: "fr"
    },
    description: {
      en: "Soil salinity class (ECe)",
      fr: "Classe de salinit� du sol (ECe)"
    },
    keywords: {
      en: [
        "Classes based on electrical conductivity of the saturation paste extract (dS/m)."
      ],
      fr: [
        "Classes bas�es sur la conductivit� �lectrique de l�extrait de p�te satur�e (dS/m)."
      ]
    },
    category: "general",
    source:
      "https://www.nrcs.usda.gov/sites/default/files/2022-10/Soil%20Electrical%20Conductivity.pdf",
    languages: ["en", "fr"],
    headers: ["Code", "en", "fr"],
    rows: [
      {
        Code: "NS",
        en: "Non-saline",
        fr: "Non salin"
      },
      {
        Code: "SS",
        en: "Slightly saline",
        fr: "L�g�rement salin"
      },
      {
        Code: "MS",
        en: "Moderately saline",
        fr: "Mod�r�ment salin"
      },
      {
        Code: "STS",
        en: "Strongly saline",
        fr: "Fortement salin"
      },
      {
        Code: "VSS",
        en: "Very strongly saline",
        fr: "Tr�s fortement salin"
      }
    ]
  },
  {
    id: 25,
    name: {
      en: "en",
      fr: "fr"
    },
    description: {
      en: "Soil sodicity class (SAR/ESP)",
      fr: "Classe de sodicité du sol (SAR/ESP)"
    },
    keywords: {
      en: [
        "Classification using Sodium Adsorption Ratio (SAR) and/or Exchangeable Sodium Percentage (ESP)."
      ],
      fr: [
        "Classification selon le rapport d’adsorption du sodium (SAR) et/ou le pourcentage de sodium échangeable (ESP)."
      ]
    },
    category: "general",
    source: "https://www.undrr.org/understanding-disaster-risk/terminology/hips/en0303",
    languages: ["en", "fr"],
    headers: ["Code", "en", "fr"],
    rows: [
      {
        Code: "NSD",
        en: "Non-sodic",
        fr: "Non sodique"
      },
      {
        Code: "SD",
        en: "Sodic",
        fr: "Sodique"
      }
    ]
  },
  {
    id: 26,
    name: {
      en: "en",
      fr: "fr"
    },
    description: {
      en: "Soil structure type",
      fr: "Type de structure du sol"
    },
    keywords: {
      en: ["Primary ped shapes used in soil description."],
      fr: ["Formes principales des agr�gats (peds)."]
    },
    category: "general",
    source: "https://iastate.pressbooks.pub/introsoilscience/chapter/soilstructure/",
    languages: ["en", "fr"],
    headers: ["Code", "en", "fr"],
    rows: [
      {
        Code: "GR",
        en: "Granular",
        fr: "Granulaire"
      },
      {
        Code: "BL",
        en: "Blocky",
        fr: "Blocailleux"
      },
      {
        Code: "PL",
        en: "Platy",
        fr: "Planaire"
      },
      {
        Code: "PR",
        en: "Prismatic",
        fr: "Prismatique"
      },
      {
        Code: "CO",
        en: "Columnar",
        fr: "Columnaire"
      },
      {
        Code: "MS",
        en: "Massive",
        fr: "Massif"
      },
      {
        Code: "SG",
        en: "Single-grained",
        fr: "Grains simples"
      }
    ]
  },
  {
    id: 27,
    name: {
      en: "en",
      fr: "fr"
    },
    description: {
      en: "Soil texture class",
      fr: "Classe texturale du sol"
    },
    keywords: {
      en: ["USDA-NRCS 12-class soil texture scheme."],
      fr: ["Schéma à 12 classes de l’USDA‑NRCS"]
    },
    category: "general",
    source: "https://www.nrcs.usda.gov/",
    languages: ["en", "fr"],
    headers: ["Code", "en", "fr"],
    rows: [
      {
        Code: "SND",
        en: "Sand",
        fr: "Sable"
      },
      {
        Code: "LSA",
        en: "Loamy sand",
        fr: "Sable loameux"
      },
      {
        Code: "SLM",
        en: "Sandy loam",
        fr: "Limon sableux"
      },
      {
        Code: "LOM",
        en: "Loam",
        fr: "Limon"
      },
      {
        Code: "SIL",
        en: "Silt loam",
        fr: "Limon limoneux"
      },
      {
        Code: "SIT",
        en: "Silt",
        fr: "Limons"
      },
      {
        Code: "SCL",
        en: "Sandy clay loam",
        fr: "Limon argilo-sableux"
      },
      {
        Code: "CLM",
        en: "Clay loam",
        fr: "Limon argileux"
      },
      {
        Code: "SCLo",
        en: "Silty clay loam",
        fr: "Limon argilo-limoneux"
      },
      {
        Code: "SAC",
        en: "Sandy clay",
        fr: "Argile sableuse"
      },
      {
        Code: "SIC",
        en: "Silty clay",
        fr: "Argile limoneuse"
      },
      {
        Code: "CLY",
        en: "Clay",
        fr: "Argile"
      }
    ]
  },
  {
    id: 28,
    name: {
      en: "Maturity Levels",
      fr: "Niveaux de maturité"
    },
    description: {
      en: "Key stages in a standard’s lifecycle—from early drafting to publication, long‑term adoption, and eventual retirement. Each status reflects how mature, stable, and widely accepted a standard is at any point in its development.",
      fr: ""
    },
    keywords: {
      en: ["standard lifecycle", "specification development", "version status"],
      fr: [
        "cycle de vie standard",
        "développement des spécifications",
        "état des versions"
      ]
    },
    category: "general",
    source: "https://linkml.io/valuesets/governance/#maturity-levels",
    languages: ["en"],
    headers: ["Code", "en"],
    rows: [
      {
        Code: "DRAFT",
        en: "Initial development, may change significantly"
      },
      {
        Code: "WORKING_DRAFT",
        en: "Active work by a working group"
      },
      {
        Code: "COMMITTEE_DRAFT",
        en: "Under formal review"
      },
      {
        Code: "CANDIDATE_RECOMMENDATION",
        en: "Ready for implementation testing"
      },
      {
        Code: "PROPOSED_STANDARD",
        en: "Stable, ready for adoption"
      },
      {
        Code: "STANDARD",
        en: "Approved and published"
      },
      {
        Code: "MATURE_STANDARD",
        en: "Well-established with wide adoption"
      },
      {
        Code: "SUPERSEDED",
        en: "Replaced by a newer version"
      },
      {
        Code: "WITHDRAWN",
        en: "No longer recommended"
      }
    ]
  },
  {
    id: 29,
    name: {
      en: "Thirty-two Point Cardinality",
      fr: "Cardinalité à trente-deux points"
    },
    description: {
      en: "The 32?wind compass rose subdivides the circle even further by adding quarter?winds, which fall halfway between each pair of 16?wind points. These �by� directions�such as north by east, northeast by north, and southwest by west—create a system of 32 points spaced at 11.25?degree intervals. Historically used in maritime navigation, this finer resolution allows much more accurate description of direction.",
      fr: "La rose des vents à 32 points subdivise davantage le cercle en ajoutant des quarts de vent, situés à mi-chemin entre chaque paire de points à 16 points. Ces directions par comme le nord par l'est, le nord-est par le nord et le sud-ouest par l'ouest créent un système de 32 points espacés de 11,25 degrés. Historiquement utilisée en navigation maritime, cette résolution plus fine permet une description beaucoup plus précise de la direction."
    },
    keywords: {
      en: [],
      fr: []
    },
    category: "general",
    source: "",
    languages: ["en", "fr"],
    headers: ["Code", "en", "fr"],
    rows: [
      {
        Code: "N",
        en: "North",
        fr: "Nord"
      },
      {
        Code: "N by E",
        en: "North by East",
        fr: "Nord quart Est"
      },
      {
        Code: "NNE",
        en: "North-Northeast",
        fr: "Nord-Nord-Est"
      },
      {
        Code: "NE by N",
        en: "Northeast by North",
        fr: "Nord-Est quart Nord"
      },
      {
        Code: "NE",
        en: "Northeast",
        fr: "Nord-Est"
      },
      {
        Code: "NE by E",
        en: "Northeast by East",
        fr: "Nord-Est quart Est"
      },
      {
        Code: "ENE",
        en: "East-Northeast",
        fr: "Est-Nord-Est"
      },
      {
        Code: "E by N",
        en: "East by North",
        fr: "Est quart Nord"
      },
      {
        Code: "E",
        en: "East",
        fr: "Est"
      },
      {
        Code: "E by S",
        en: "East by South",
        fr: "Est quart Sud"
      },
      {
        Code: "ESE",
        en: "East-Southeast",
        fr: "Est-Sud-Est"
      },
      {
        Code: "SE by E",
        en: "Southeast by East",
        fr: "Sud-Est quart Est"
      },
      {
        Code: "SE",
        en: "Southeast",
        fr: "Sud-Est"
      },
      {
        Code: "SE by S",
        en: "Southeast by South",
        fr: "Sud-Est quart Sud"
      },
      {
        Code: "SSE",
        en: "South-Southeast",
        fr: "Sud-Sud-Est"
      },
      {
        Code: "S by E",
        en: "South by East",
        fr: "Sud quart Est"
      },
      {
        Code: "S",
        en: "South",
        fr: "Sud"
      },
      {
        Code: "S by W",
        en: "South by West",
        fr: "Sud quart Ouest"
      },
      {
        Code: "SSW",
        en: "South-Southwest",
        fr: "Sud-Sud-Ouest"
      },
      {
        Code: "SW by S",
        en: "Southwest by South",
        fr: "Sud-Ouest quart Sud"
      },
      {
        Code: "SW",
        en: "Southwest",
        fr: "Sud-Ouest"
      },
      {
        Code: "SW by W",
        en: "Southwest by West",
        fr: "Sud-Ouest quart Ouest"
      },
      {
        Code: "WSW",
        en: "West-Southwest",
        fr: "Ouest-Sud-Ouest"
      },
      {
        Code: "W by S",
        en: "West by South",
        fr: "Ouest quart Sud"
      },
      {
        Code: "W",
        en: "West",
        fr: "Ouest"
      },
      {
        Code: "W by N",
        en: "West by North",
        fr: "Ouest quart Nord"
      },
      {
        Code: "WNW",
        en: "West-Northwest",
        fr: "Ouest-Nord-Ouest"
      },
      {
        Code: "NW by W",
        en: "Northwest by West",
        fr: "Nord-Ouest quart Ouest"
      },
      {
        Code: "NW",
        en: "Northwest",
        fr: "Nord-Ouest"
      },
      {
        Code: "NW by N",
        en: "Northwest by North",
        fr: "Nord-Ouest quart Nord"
      },
      {
        Code: "NNW",
        en: "North-Northwest",
        fr: "Nord-Nord-Ouest"
      },
      {
        Code: "N by W",
        en: "North by West",
        fr: "Nord quart Ouest"
      }
    ]
  },
  {
    id: 30,
    name: {
      en: "Water Table Characteristics",
      fr: "Caractéristiques de la nappe phréatique"
    },
    description: {
      en: "Indicates the presence of a water table at a depth of 100cm, and identifies its temporal characteristics.",
      fr: "Indique la présence d’une nappe phréatique à une profondeur de 100 cm et précise ses caractéristiques temporelles."
    },
    keywords: {
      en: [],
      fr: []
    },
    category: "general",
    source: "https://sis.agr.gc.ca/cansis/nsdb/soil/v2/snt/watertbl.html",
    languages: ["en", "fr"],
    headers: ["Code", "en", "fr"],
    rows: [
      {
        Code: "YB",
        en: "Always",
        fr: "Toujours"
      },
      {
        Code: "YG",
        en: "Growing season",
        fr: "Saison de croissance"
      },
      {
        Code: "YN",
        en: "Non growing season",
        fr: "Hors saison de croissance"
      },
      {
        Code: "YU",
        en: "Unspecified period",
        fr: "Période non précisée"
      },
      {
        Code: "NO",
        en: "Never",
        fr: "Jamais"
      },
      {
        Code: "-",
        en: "Not applicable",
        fr: "Sans objet / Non applicable"
      }
    ]
  }
];

const entryCodePicklists = JSON.parse(json);
export default entryCodePicklists;

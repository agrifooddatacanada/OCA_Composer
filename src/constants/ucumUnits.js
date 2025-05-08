const ucumUnits = [
  {
    code: "[acr_br]",
    label: "British acre",
    description:
      "A unit of land area measurement, commonly used in the United Kingdom and some other Commonwealth countries"
  },
  {
    code: "[acr_us]",
    label: "American acre",
    description:
      "A unit of land area measurement, widely used in the United States of America for land transactions"
  },
  {
    code: "har",
    label: "Hectare or hectoare",
    description:
      "A metric unit of land area measurement, commonly used worldwide for large land areas in agriculture and planning"
  },
  {
    code: "ar",
    label: "100 m2 (are)",
    description:
      "A metric unit of land area measurement, less common but used used historically in European countries for measuring land"
  },
  {
    code: "[bu_us]",
    label: "bushel",
    description:
      "A unit of volume or weight used to measure agricultural commodities, primparly dry goods, fruits, and vegetables"
  },
  {
    code: "kg/har",
    label: "kilogram/hectare",
    description:
      "A measure of the total weight in kilograms of a specific crop or agricultural product harvested from a one-hectare area of land"
  },
  {
    code: "[hd_i]",
    label: "hand (height of horse)",
    description:
      "A unit of measurement for the horse's height at the highest point of the horse's back to the hooves"
  },
  {
    code: "osm",
    label: "osmole (amount of dissolved particles)",
    description:
      "An osmole is a unit of measurement used quantify the number of osmotically active particle or solute particles in solution"
  },
  {
    code: "Cel",
    label: "degrees celcius ",
    description: "A unit of measurement used to express temperature in the metric system"
  },
  {
    code: "[degF]",
    label: "degrees farenheit",
    description:
      "A unit of temperature measurement commonly used in the United States of America"
  },
  {
    code: "[degR]",
    label: "degree Rankine",
    description: "A unit of temperature measurement in the absolute temperature scale"
  },
  {
    code: "[degRe]",
    label: "degree Reaumur",
    description:
      "A unit of temperature measurement expressed as a positive or negative value relative to reference points"
  },
  {
    code: "cal_[15]",
    label: "calorie at 15 degree celsius",
    description:
      "Representing the amount of energy required to raise the temperature of 1 gram of water by 1 degree celsius. Approximately equal to 4.184 joules. This is the standard unit for calories"
  },
  {
    code: "cal_m",
    label: "mean calorie",
    description:
      "Measurement for energy used in nutrition and represents the energy required to raise the temperature of 1 kilogram of water by 1 degree Celsius"
  },
  {
    code: "cal_IT",
    label: "internation table calorie",
    description: 'Synonymous with the "mean calorie"'
  },
  {
    code: "cal_th",
    label: "thermochemical calorie",
    description:
      "Unit of energy associated with chemical reactions or thermal processes which is commonly used in thermodynamics"
  },
  {
    code: "cal",
    label: "calorie",
    description:
      "A unit of energy required to raise the temperature of 1 gram of water by 1 degree celsius"
  },
  {
    code: "[Btu_39]",
    label: "British thermal unit at 39 degrees F",
    description:
      "Unit of energy for measuring heating and cooling energy. It is specific to the energy content of substance at 39 degrees Fahrenheit"
  },
  {
    code: "[Btu_59]",
    label: "British thermal unit at 59 degrees F",
    description:
      "Unit of energy for measuring heating and cooling energy. It is specific to the energy content of substance at 59 degrees Fahrenheit"
  },
  {
    code: "[Btu_60]",
    label: "British thermal unit at 60 degrees F",
    description:
      "Unit of energy for measuring heating and cooling energy. It is specific to the energy content of substance at 60 degrees Fahrenheit"
  },
  {
    code: "[Btu_m]",
    label: "mean British thermal unit",
    description:
      "Representing the amount of energy required to raise the temperature of 1pound of water by one degree Farenheit when the intial and final temperatures vary"
  },
  {
    code: "[Btu_IT]",
    label: "international table British thermal unit",
    description:
      "Unit of energy measurement that represents the amount of energy require to raise the temperature of 1 pound of water"
  },
  {
    code: "[dpt_us]",
    label: "US dry pint",
    description:
      "Unit of volume measurement used in the United States to quantify the volume of dry goods"
  },
  {
    code: "[bbl_us]",
    label: "US barrel",
    description:
      "Unit of volume measurment used in the United States for measuring the capacity of liquid or dy substances"
  },
  {
    code: "[qt_us]",
    label: "US quart",
    description:
      "Unit of volume measurement used in the United States to quantify volume of both liquid and dry substances"
  },
  {
    code: "[pt_us]",
    label: "US pint",
    description: "Unit of volume measurement in the United States"
  },
  {
    code: "[gil_us]",
    label: "US gill",
    description:
      "Unit of volume measurement that was traditionally used in the United States "
  },
  {
    code: "[foz_us]",
    label: "US fluid ounce",
    description: "Unit of volume measurement in the United States"
  },
  {
    code: "[fdr_us]",
    label: "US fluid dram",
    description: "Unit of volume measurement in the United States"
  },
  {
    code: "[min_us]",
    label: "US minim",
    description: "Unit of volume measurement typically used in pharmacy and medicine"
  },
  {
    code: "[crd_us]",
    label: "US cord",
    description: "Unit of volume used to quantify a stack of wood logs"
  },
  {
    code: "[gal_wi]",
    label: "US historical winchester gallon",
    description: "A historical unit of volume measurement use for grain, and produce"
  },
  {
    code: "[pk_us]",
    label: "US peck",
    description: "A historical unit of volume measurement use for grain, and produce"
  },
  {
    code: "[dqt_us]",
    label: "US dry quart",
    description: "Unit of volume measurement in the United States"
  },
  {
    code: "[tbs_us]",
    label: "US tablespoon",
    description: "Unit of volume measurement in the United States"
  },
  {
    code: "[tsp_us]",
    label: "US teaspoon",
    description: "Unit of volume measurement in the United States"
  },
  {
    code: "[cup_us]",
    label: "US cup",
    description: "Unit of volume measurement in the United States"
  },
  {
    code: "[foz_m]",
    label: "metric fluid ounce",
    description: "Unit of volume measurement used in some countries"
  },
  {
    code: "[cup_m]",
    label: "metric cup",
    description: "Unit of volume measurement used in some countries"
  },
  {
    code: "[tsp_m]",
    label: "metric teaspoon",
    description: "Unit of volume measurement used in some countries"
  },
  {
    code: "[tbs_us]",
    label: "metric tablespoon",
    description: "Unit of volume measurement used in some countries"
  },
  {
    code: "[gal_us]",
    label: "US Queen Anne's wine gallon",
    description: "A historical unit of volume measurement "
  },
  {
    code: "[gal_br]",
    label: "British gallon",
    description: "Unit of volume measurement in the United Kingdom"
  },
  {
    code: "[pk_br]",
    label: "British peck",
    description: "Unit of volume measurement in the United Kingdom"
  },
  {
    code: "[bu_br]",
    label: "British bushel",
    description: "Unit of volume measurement in the United Kingdom"
  },
  {
    code: "[qt_br]",
    label: "British quart",
    description: "Unit of volume measurement in the United Kingdom"
  },
  {
    code: "[pt_br]",
    label: "British pint",
    description: "Unit of volume measurement in the United Kingdom"
  },
  {
    code: "[gil_br]",
    label: "British gill",
    description: "Unit of volume measurement in the United Kingdom"
  },
  {
    code: "[foz_br]",
    label: "British fluid ounce",
    description: "Unit of volume measurement in the United Kingdom"
  },
  {
    code: "[fdr_br]",
    label: "British fluid dram",
    description: "Unit of volume measurement in the United Kingdom"
  },
  {
    code: "[min_br]",
    label: "British minim",
    description: "Unit of volume measurement in the United Kingdom"
  },
  { code: "[gr]", label: "grain", description: "Unit of mass " },
  { code: "[lb_av]", label: "pound", description: "Unit of mass " },
  { code: "[oz_av]", label: "ounce", description: "Unit of mass " },
  {
    code: "[dr_av]",
    label: "dram",
    description: "Unit of mass traditionally used in field of pharmacology or medicine"
  },
  {
    code: "[scwt_av]",
    label: "US hundredweight",
    description: "Unit of mass used in the Untited States"
  },
  {
    code: "[lcwt_av]",
    label: "British hunderweight",
    description: "Unit of mass used in the United Kingdom"
  },
  {
    code: "[ston_av]",
    label: "US ton",
    description: "Unit of mass used in the United States"
  },
  {
    code: "[lton_av]",
    label: "British ton",
    description: "Unit of mass used in the United Kingdom"
  },
  {
    code: "[stone_av]",
    label: "British stone",
    description: "Unit of mass used in the United Kingdom"
  },
  { code: "hm", label: "hectometer", description: "Unit of length" },
  { code: "hL", label: "hectolitre", description: "Unit of volume" },
  { code: "[fur_us]", label: "furlong", description: "Unit of length" },
  { code: "[rd_us]", label: "rod", description: "Unit of length" },
  { code: "[lk_us]", label: "link", description: "Unit of length" },
  { code: "[gil_us]", label: "gill", description: "Unit of volume" },
  { code: "[gr]", label: "grain", description: "Unit mass" },
  { code: "[pk_us]", label: "Peck", description: "Unit of volume" },
  { code: "[bbl_us]", label: "barrel", description: "Unit of volume" },
  { code: "[crd_us]", label: "cord", description: "Unit of volume" },
  {
    code: "[fdr_us]",
    label: "fluid dram",
    description: "Unit of volume"
  },
  { code: "[min_us]", label: "minim", description: "Unit of volume" },
  { code: "kg", label: "kilogram", description: "SI unit for mass" },
  { code: "g", label: "gram", description: "Unit of mass" },
  { code: "mg", label: "milligram", description: "Unit of mass" },
  { code: "ug", label: "microgram", description: "Unit of mass" },
  { code: "ng", label: "nanogram", description: "Unit of mass" },
  { code: "pg", label: "picogram", description: "Unit of mass" },
  {
    code: "mg/kg",
    label: "milligram per kilogram",
    description:
      "Unit of concentration or dosage commonly used in the field of medicine and toxicology to express the quantity of substance in a particular context"
  },
  {
    code: "ug/kg",
    label: "microgram per kilogram",
    description:
      "Unit of concentration or dosage. It represents the number of micrograms (one millionth of a gram) of a substance present within every kilogram (one thousand grams) of a given material, such as body weight or a sample"
  },
  {
    code: "mg/m2",
    label: "milligram per square metre",
    description:
      "Unit of surface or areal density that measures the mass of a substance distributed over one square meter"
  },
  {
    code: "ug/m2",
    label: "microgram per square metre",
    description:
      "Unit of surface or areal density that measures the mass of a substance distributed over one square meter"
  },
  { code: "L", label: "litre", description: "SI unit for volume" },
  { code: "mL", label: "millilitre", description: "Unit of volume" },
  { code: "uL", label: "microlitre", description: "Unit of volume" },
  {
    code: "Bq",
    label: "Becquerel",
    description: "SI unit of radioactivity"
  },
  {
    code: "GBq",
    label: "gigabecquerel",
    description: "Becquerel on the order of 10^9"
  },
  {
    code: "MBq",
    label: "megabecquerel",
    description: "Becquerel on the order of 10^6"
  },
  {
    code: "kBq",
    label: "killobecquerel",
    description: "Becquerel on the order of 10^3"
  },
  {
    code: "Ci",
    label: "curie",
    description: "Unit of radioactivity non SI "
  },
  {
    code: "mCi",
    label: "millicurie",
    description: "Curie on the order of 10^(-3)"
  },
  {
    code: "uCi",
    label: "microcurie",
    description: "Curie on the order of 10^(-6)"
  },
  {
    code: "nCi",
    label: "nanocurie",
    description: "Curie on the order of 10^(-9)"
  },
  {
    code: "mol",
    label: "mole",
    description: "SI unit used to quantify the amount of a substance"
  },
  {
    code: "mmol",
    label: "millimole",
    description: "Mole on the order of 10^(-3)"
  },
  {
    code: "umol",
    label: "micromole",
    description: "Mole on the order of 10^(-6)"
  },
  {
    code: "[iU]",
    label: "international unit",
    description: "Unit to quantify the biological activity or potency of substances"
  },
  {
    code: "k[iU]",
    label: "kilo-international unit",
    description: "International unit on the order of 10^(3)"
  },
  {
    code: "M[iU]",
    label: "mega-international unit",
    description: "International unit on the order of 10^(6)"
  },
  {
    code: "[iU]/kg",
    label: "international unit per kilogram",
    description: "Unit of concentration or dosage "
  },
  {
    code: "meq",
    label: "milliequivalent",
    description:
      "Unit of measurement used to express the chemical equivalent of ions or molecules in solution"
  },
  {
    code: "%",
    label: "% percent",
    description: "Fractional representation normalized by 100"
  },
  {
    code: "[drp]",
    label: "drop (1/12 millilitre)",
    description: "Unit of volume"
  },
  {
    code: "{DF}",
    label: "dosage form",
    description: "Specification of physical form of medication or pharmaceutical product"
  },
  { code: "[dye'U]", label: "Dye unit", description: NaN },
  {
    code: "%{Hb}",
    label: "percent hemoglobin",
    description:
      "Measurement of specific hemoglobin as a percentage of the total hemoglobin in a blood sample"
  },
  {
    code: "%{RBCs}",
    label: "percent of red blood cells",
    description: "Proportion of red blood cells in a blood sample"
  },
  {
    code: "%{WBCs}",
    label: "percent of white blood cells",
    description: "Proportion of white blood cells in a blood sample "
  },
  {
    code: "%{abnormal}",
    label: "percent abnormal",
    description:
      "Generally implies the percentage of something that is considered unexpected"
  },
  {
    code: "%{activity}",
    label: "percent activity",
    description:
      "Generally implies the percentage of physical, enzymatic, or radioactive activity"
  },
  {
    code: "%{aggregation}",
    label: "percent aggregation",
    description: "Generally quantifies the extent of collective assembly "
  },
  {
    code: "%{at_60_min}",
    label: "percent at 60 minute",
    description:
      "Measurement expressed as a percentage after a specific duration of 60 minutes "
  },
  {
    code: "%{bacteria}",
    label: "percent of bacteria",
    description: "Proportion of bacteria in a sample"
  },
  {
    code: "%{basal_activity}",
    label: "percent basal activity",
    description:
      "Level of activity of a biological or chemical process in relation to its resting state"
  },
  {
    code: "%{baseline}",
    label: "percent of baseline",
    description: "Value relative to initial starting point"
  },
  {
    code: "%{binding}",
    label: "percent binding",
    description: "Describes the extent to which molecules bind to specific receptors"
  },
  {
    code: "%{blockade}",
    label: "percent blockade",
    description:
      "Describes the degree to which a pathway is inhibitited or blocked by an intervention"
  },
  {
    code: "%{blocked}",
    label: "percent blocked",
    description: "Referes to the percentage of something that has been obstructed"
  },
  {
    code: "%{bound}",
    label: "percent bound",
    description:
      "Describes the proportion of molecules that have successfully bound to specifc target molecules"
  },
  {
    code: "%{breakdown}",
    label: "percent breakdown",
    description: "Distribution of something into different categories"
  },
  {
    code: "%{cells}",
    label: "percent of cells",
    description:
      "Describes the proportion of a type of cell wihtin a larger sample of cells"
  },
  {
    code: "%{deficient}",
    label: "percent deficient",
    description:
      "Refers to the proportion of individuals that are lacking a particular quality"
  },
  {
    code: "%{dose}",
    label: "percent dose",
    description:
      "Expresses the fraction of percentage of a prescribed dosage of treatment that has been administered"
  },
  {
    code: "%{excretion}",
    label: "percent excretion",
    description:
      "Expresses the fraction of percentage of a substance that has been expelled from the body "
  },
  {
    code: "%{hemolysis}",
    label: "percent hemolysis",
    description: "Used to assess the degree of red blood cell lysis in a sample"
  },
  {
    code: "%{index}",
    label: "percent index",
    description: "Broad term that describes percentage related to an index "
  },
  {
    code: "%{inhibition}",
    label: "percent inhibition",
    description:
      "Quantifies the extent to which a substance suppresses biological activity"
  },
  {
    code: "%{loss_AChR}",
    label: "percent  loss of acetylcholine receptor",
    description:
      "Referes to the precentage reduction in the number of acetylcholine receptors in a biological system compared to baseline"
  },
  {
    code: "%{loss}",
    label: "percent loss",
    description:
      "Quantifies the reduction in a parameter expressed as a percentage of the initial amount"
  },
  {
    code: "%{lysis}",
    label: "percent lysis",
    description: "Quantifies the degree to which cells have ruptured"
  },
  {
    code: "%{normal}",
    label: "percent normal",
    description: "Proportion of entities that meet a certain criteria"
  },
  {
    code: "%{penetration}",
    label: "percent  penetration",
    description: "Extent to which a substance has permeated a barrier"
  },
  {
    code: "%{pooled_plasma}",
    label: "percent normal pooled plasma",
    description:
      "Proportion of a specific factor in a pooled sample of plasma compared to the concentration of the same factor in a normal plasma sample"
  },
  {
    code: "%{positive}",
    label: "percent positive",
    description: "Proportion of positive outcomes wihtin a given data set"
  },
  {
    code: "%{reactive}",
    label: "percent reactive",
    description:
      "Measurement used to describe the percentage of specific group that responds in a particular way to stimulus"
  },
  {
    code: "%{recovery}",
    label: "percent recovery",
    description:
      "Percentage of a substance that has been successfully regained relative to initial value"
  },
  {
    code: "%{reference}",
    label: "percent reference",
    description: "Refers to the percentage of value relative to a baseline value"
  },
  {
    code: "%{relative}",
    label: "relative percent",
    description: "Refers to the percentage of value relative to a baseline value"
  },
  {
    code: "%{residual}",
    label: "percent residual",
    description: "Percentage of something that remains "
  },
  {
    code: "%{saturation}",
    label: "percent saturation",
    description:
      "Expresses the extrent to which a substance or solution is filled with another substance"
  },
  {
    code: "%{total}",
    label: "percent total",
    description:
      "Expresses the proportion of a specific component relative to the whole dataset"
  },
  {
    code: "%{uptake}",
    label: "percent uptake",
    description:
      "Percentage of absorbed substance taken up by a specific system in relation to the total available amount"
  },
  {
    code: "%{viable}",
    label: "percent viable",
    description: "Percentage of living viable entities within a larger group"
  },
  {
    code: "%{vol}",
    label: "percent by volume",
    description:
      "Concentration of one substance in a mixture relative to the total volume of the mixture"
  },
  {
    code: "/(12.h)",
    label: "per twelve hour",
    description: "Indicates an action occuring every twelve hours"
  },
  {
    code: "/10*10",
    label: "per 10 billion",
    description: "Rate relative to 10 billion units"
  },
  {
    code: "/10*12",
    label: "per trillion",
    description: "Rate relative to 1 trillion units"
  },
  {
    code: "/10*12{RBCs}",
    label: "per trillion red blood cells",
    description: "Rate relavtive to 1 trillion red blood cells"
  },
  {
    code: "/10*3",
    label: "per thousand",
    description: "Rate relative to 1 thousand untis"
  },
  {
    code: "/10*3{RBCs}",
    label: "per thousand red blood cells",
    description: "Rate relative to 1 thousand blood cells"
  },
  {
    code: "/10*4{RBCs}",
    label: "per 10 thousand red blood cells",
    description: "Rate relative to 10 thousand red blood cells"
  },
  {
    code: "/10*6",
    label: "per million",
    description: "Rate relative to 1 million units"
  },
  {
    code: "/10*9",
    label: "per billion",
    description: "Rate relative to 1 billion units"
  },
  {
    code: "/100",
    label: "per 100",
    description: "Rate relative to 100 units"
  },
  {
    code: "/100{WBCs}",
    label: "per 100 white blood cells",
    description: "Rate relative to 100 white blood cells"
  },
  {
    code: "/100{cells}",
    label: "per 100 cells",
    description: "Rate relative to 100 cells"
  },
  {
    code: "/100{neutrophils}",
    label: "per 100 neutrophils",
    description: "Rate relative to 100 neutrophils"
  },
  {
    code: "/100{spermatozoa}",
    label: "per 100 spermatozoa",
    description: "Rate relative to 100 spermatozoa"
  },
  {
    code: "/L",
    label: "per litre",
    description: "Rate relative to the SI unit for volume"
  },
  {
    code: "/U",
    label: "per enzyme unit",
    description: "Rate relative to 1 enzyme+D151 unit"
  },
  {
    code: "/[HPF]",
    label: "per high power field",
    description: "Rate relative to high"
  },
  {
    code: "/[LPF]",
    label: "per low power field",
    description: "Rate relative to a high power field, often used in microscopy"
  },
  {
    code: "/[arb'U]",
    label: "per arbitrary unit",
    description: "Rate relative to some unit"
  },
  {
    code: "/[iU]",
    label: "per international unit",
    description: "Rate relative to 1 international unit"
  },
  {
    code: "/a",
    label: "per year",
    description: "Rate of time relative to one year"
  },
  {
    code: "/cm[H2O]",
    label: "per centimetre of water",
    description: "Rate relative to one centimeter of water"
  },
  {
    code: "/d",
    label: "per day",
    description: "Rate of time relative to one day"
  },
  {
    code: "/dL",
    label: "per decilitre",
    description: "Rate relative to 1 decilitre "
  },
  {
    code: "/g",
    label: "per gram",
    description: "Rate relative to 1 gram"
  },
  {
    code: "/g{Hb}",
    label: "per gram of hemoglobin",
    description: "Rate relative to 1 gram of hemoglobin"
  },
  {
    code: "/g{creat}",
    label: "per gram of creatinine",
    description: "Rate relative to 1 gram of creatinine"
  },
  {
    code: "/g{tot_nit}",
    label: "per gram of total nitrogen",
    description: "Rate relative to 1 gram of total nitrogen"
  },
  {
    code: "/g{tot_prot}",
    label: "per gram of total protein",
    description: "Rate relative to 1 gram of total protein"
  },
  {
    code: "/g{wet_tis}",
    label: "per gram of wet tissue",
    description: "Rate relative to 1 gram of wet tissue"
  },
  {
    code: "/h",
    label: "per hour",
    description: "Rate of time relative to 1 hour"
  },
  {
    code: "/kg",
    label: "per kilogram",
    description: "Rate relative to SI unit for mass"
  },
  {
    code: "/kg{body_wt}",
    label: "per kilogram of body weight",
    description: "Rate relative to the mass of one's body "
  },
  {
    code: "/m2",
    label: "per square metre",
    description: "Rate relative to the area of 1 square metre"
  },
  {
    code: "/m3",
    label: "per cubic metre",
    description: "Rate relative to the volume of 1 cubic metre"
  },
  {
    code: "/mL",
    label: "per millilitre",
    description: "Rate relative to the volume of 1 millilitre"
  },
  {
    code: "/mg",
    label: "per milligram",
    description: "Rate relative to 1 milligram"
  },
  {
    code: "/min",
    label: "per minute",
    description: "Rate of time relative to 1 minute"
  },
  {
    code: "/mm",
    label: "per millimetre",
    description: "Rate relative to 1 millimetre"
  },
  {
    code: "/mmol{creat}",
    label: "per millimole of creatinine",
    description: "Rate relative to 1 millimole of creatinine"
  },
  {
    code: "/mo",
    label: "per month",
    description: "Rate of time relative to one month"
  },
  {
    code: "/s",
    label: "per second",
    description: "Rate of time relative to 1 second"
  },
  {
    code: "/uL",
    label: "per microlitre",
    description: "Rate relative to 1 microlitre"
  },
  {
    code: "/wk",
    label: "per week",
    description: "Rate of time relative to 1 week"
  },
  {
    code: "/{OIF}",
    label: "per oil immersion field",
    description:
      "Frequency of specific microscopic entities within the field of view of a microscope"
  },
  {
    code: "/{entity}",
    label: "per entity",
    description: "Rate in relation to specific units"
  },
  {
    code: "10*12/L",
    label: "trillion per litre",
    description:
      "Expresses a rate of 1 trillion units in relation to a volume of one litre"
  },
  { code: "10*3", label: "thousand", description: "Numeric value" },
  {
    code: "10*3/L",
    label: "thousand per litre",
    description: "Rate of 1 thousand units relative to 1 litre"
  },
  {
    code: "10*3/mL",
    label: "thousand per millilitre",
    description: "Concentration of 1 thousand units in relation to volume of 1 millilitre"
  },
  {
    code: "10*3/uL",
    label: "thousand per microlitre",
    description: "Concentration of 1 thousand units in relation to volume of 1 microlitre"
  },
  {
    code: "10*3{RBCs}",
    label: "thousand red blood cells",
    description: "Count of red blood cells"
  },
  {
    code: "10*3{copies}/mL",
    label: "thousand copies per millilitre",
    description: "Rate of 1 thousand copies relative to the volume of 1 milliltre"
  },
  {
    code: "10*4/uL",
    label: "10 thousand per microlitre",
    description: "Rate of 10 thousand units relative to the volume of  1 microlitre"
  },
  {
    code: "10*5",
    label: "one hundred thousand",
    description: "Numeric value"
  },
  { code: "10*6", label: "million", description: "Numeric value" },
  {
    code: "10*6.[CFU]/L",
    label: "million colony forming unit per litre",
    description:
      "Concentration of viable microorganisms in a liquid sample relative to one litre"
  },
  {
    code: "10*6.[iU]",
    label: "million international unit",
    description: "International unit on the order of 1 million"
  },
  {
    code: "10*6/(24.h)",
    label: "million per 24 hour",
    description: "1 million units relative to 24 hours"
  },
  {
    code: "10*6/L",
    label: "million per litre",
    description: "1 million units relative to 1 litre"
  },
  {
    code: "10*6/kg",
    label: "million per kilogram",
    description: "1 million units relative to 1 kilogram"
  },
  {
    code: "10*6/mL",
    label: "million per millilitre",
    description: "1 million units relative to 1 millitre"
  },
  {
    code: "10*6/uL",
    label: "million per microlitre",
    description: "1 million units per 1 microlitre"
  },
  { code: "10*8", label: "100 million", description: "Numeric value" },
  {
    code: "10*9/L",
    label: "billion per litre",
    description: "1 billion units relative to 1 litre"
  },
  {
    code: "10*9/mL",
    label: "billion per millilitre",
    description: "1 billion units relative to 1 microlitre"
  },
  {
    code: "10*9/uL",
    label: "billion per microlitre",
    description: "1 billion units relative to 1 microlitre"
  },
  {
    code: "10.L/(min.m2)",
    label: "10 litre per minute per square metre",
    description: "10 litres relative to 1 minute relative to the are of 1 square metre"
  },
  {
    code: "10.L/min",
    label: "10 litre per minute",
    description: "Rate of 10 litres per 1 minute"
  },
  {
    code: "10.uN.s/(cm5.m2)",
    label: "10 micronewton second per centimetre to the fifth power per square metre",
    description: "Dynamic viscosity "
  },
  { code: "24.h", label: "24 hour", description: "1 day" },
  {
    code: "[CCID_50]",
    label: "50% cell culture infectious dose",
    description: "Quantifies the infectivity of a virus"
  },
  {
    code: "A",
    label: "ampere",
    description: "Rate at which electric charge moves through a conductor"
  },
  {
    code: "[EID_50]",
    label: "50% embryo infectious dose",
    description: "Quantifies the infectous does of a virus in embryos"
  },
  {
    code: "A/m",
    label: "ampere per metre",
    description: "Describes the magnetic field strength"
  },
  {
    code: "[TCID_50]",
    label: "50% tissue culture infectious dose",
    description: "Quantifies the infectious does of a virus in a tissue culture"
  },
  {
    code: "[anti'Xa'U]",
    label: "anti factor Xa unit",
    description: "Quantifies the activity of anticoagulant drugs"
  },
  {
    code: "Cel",
    label: "degree Celsius",
    description: "Measurement of temperature"
  },
  {
    code: "F",
    label: "Farad",
    description: "Unit of electrical capacitance"
  },
  {
    code: "Gy",
    label: "Gray",
    description: "SI unit of absorbed dose of ionizing radition"
  },
  { code: "H", label: "Henry", description: "SI unit of inductance " },
  { code: "Hz", label: "Hertz", description: "SI unit of frequency" },
  { code: "J", label: "joule", description: "SI unit of energy" },
  {
    code: "J/L",
    label: "joule per litre",
    description: "Expresses the energy density of a substance "
  },
  {
    code: "K",
    label: "degree Kelvin",
    description: "Measurement of temperature"
  },
  {
    code: "K/W",
    label: "degree Kelvin per Watt",
    description: "Quantifies how a material resists the flow of heat per unit of power"
  },
  {
    code: "L/(24.h)",
    label: "litre per 24 hour",
    description: "Rate of volume over a 24 hour period"
  },
  {
    code: "L/(8.h)",
    label: "litre per 8 hour",
    description: "Rate of volume over an 8 hour period"
  },
  {
    code: "L/(min.m2)",
    label: "litre per minute per square metre",
    description: "Flow rate per unit area"
  },
  {
    code: "L/L",
    label: "litre per litre",
    description: "Ratio of 2 volumes "
  },
  {
    code: "L/d",
    label: "litre per day",
    description: "Volume rate over 1 day"
  },
  {
    code: "L/h",
    label: "litre per hour",
    description: "Volume rate over 1 hour"
  },
  {
    code: "L/kg",
    label: "litre per kilogram",
    description: "Ratio of volume to mass"
  },
  {
    code: "L/min",
    label: "litre per minute",
    description: "Volume rate over 1 minute"
  },
  {
    code: "L/s",
    label: "litre per second",
    description: "Volume rate over 1 second"
  },
  {
    code: "L/s/s2",
    label: "litre per second per square second",
    description: "Rate of fluid flow acceleration"
  },
  {
    code: "Ms",
    label: "megasecond",
    description: "Second on the order of 10^6"
  },
  { code: "N", label: "Newton", description: "SI unit of force" },
  {
    code: "N.cm",
    label: "Newton centimetre",
    description: "Expresses torque"
  },
  {
    code: "N.s",
    label: "Newton second",
    description: "SI unit of impulse"
  },
  {
    code: "Ohm",
    label: "Ohm",
    description: "SI unit of electrical resistance"
  },
  {
    code: "Ohm.m",
    label: "Ohm metre",
    description: "SI unit of electrical resistivity"
  },
  { code: "Pa", label: "Pascal", description: "SI unit of pressure" },
  {
    code: "S",
    label: "Siemens",
    description: "SI units of electrical conductance"
  },
  {
    code: "Sv",
    label: "Sievert",
    description: "SI unit of dose equivalent"
  },
  {
    code: "T",
    label: "Tesla",
    description: "SI unit of magnetif flux density "
  },
  { code: "Torr", label: "Torr", description: "Unit of pressure" },
  {
    code: "U",
    label: "enzyme unit",
    description: "Concentration of an enzyme in a reaction"
  },
  {
    code: "U/(10.g){feces}",
    label: "enzyme unit per 10 gram of faeces",
    description: "Concentration of an enzyme in a fecal sample"
  },
  {
    code: "U/(12.h)",
    label: "enzyme unit per 12 hour",
    description: "Rate of concentration of an enzyme in a reaction every 12 hours"
  },
  {
    code: "U/(2.h)",
    label: "enzyme unit per 2 hour",
    description: "Rate of concentration of an enzyme in a reaction every 2 hours"
  },
  {
    code: "U/(24.h)",
    label: "enzyme unit per 24 hour",
    description: "Rate of concentration of an enzyme in a reaction every 24 hours"
  },
  {
    code: "U/10",
    label: "enzyme unit per 10",
    description: "Enzyme concentration"
  },
  {
    code: "U/10*10",
    label: "enzyme unit per 10 billion",
    description: "Enzyme concentration"
  },
  {
    code: "U/10*10{cells}",
    label: "enzyme unit per 10 billion cells",
    description: "Enzyme concentration relative to 10 billion cells"
  },
  {
    code: "U/10*12",
    label: "enzyme unit per trillion",
    description: "Enzyme concentration"
  },
  {
    code: "U/10*12{RBCs}",
    label: "enzyme unit per trillion red blood cells",
    description: "Enzyme concentration"
  },
  {
    code: "U/10*6",
    label: "enzyme unit per million",
    description: "Enzyme concentration"
  },
  {
    code: "U/10*9",
    label: "enzyme unit per billion",
    description: "Enzyme concentration"
  },
  {
    code: "U/L",
    label: "enzyme unit per litre",
    description: "Enzyme concentration relative to 1 litre"
  },
  {
    code: "U/d",
    label: "enzyme unit per day",
    description: "Enzyme activity over a 24 hour period"
  },
  {
    code: "U/dL",
    label: "enzyme unit per decilitre",
    description: "Enzyme concentration"
  },
  {
    code: "U/g",
    label: "enzyme unit per gram",
    description: "Enzyme concentration"
  },
  {
    code: "U/g{Hb}",
    label: "enzyme unit per gram of hemoglobin",
    description: "Enzyme concentration relative to 1 gram of hemoglobin"
  },
  {
    code: "U/g{creat}",
    label: "enzyme unit per gram of creatinine",
    description: "Enzyme concentration relative to 1 gram of creatinine"
  },
  {
    code: "U/g{protein}",
    label: "enzyme unit per gram of protein",
    description: "Enzyme concentratoin relative to 1 gram of protein"
  },
  {
    code: "U/h",
    label: "enzyme unit per hour",
    description: "Enzyme concentration "
  },
  {
    code: "U/kg{Hb}",
    label: "enzyme unit per kilogram of hemoglobin",
    description: "Enzyme concentration relative to 1 kilogram of hemoglobin"
  },
  {
    code: "U/mL",
    label: "enzyme unit per millilitre",
    description: "Enzyme concentration"
  },
  {
    code: "U/mL{RBCs}",
    label: "enzyme unit per millilitre of red blood cells",
    description: "Enzyme concentration relative to 1 millilitre of red blood cells"
  },
  {
    code: "U/min",
    label: "enzyme unit per minute",
    description: "Enzyme concentration per minute"
  },
  {
    code: "U/mmol{creat}",
    label: "enzyme unit per millimole of creatinine",
    description: "Enzyme concentration relative to one millimole of creatinine"
  },
  {
    code: "U/s",
    label: "enzyme unit per second",
    description: "Enzyme activity over a one second period"
  },
  {
    code: "U{25Cel}/L",
    label: "enzyme unit per litre at 25 deg Celsius",
    description: "Enzyme concentration"
  },
  {
    code: "U{37Cel}/L",
    label: "enzyme unit per litre at 37 deg Celsius",
    description: "Enzyme concentration"
  },
  {
    code: "V",
    label: "volt",
    description: "SI unit of electrical potential difference, EMF, and voltage"
  },
  { code: "Wb", label: "Weber", description: "SI unit of magnetic flux" },
  {
    code: "[APL'U]",
    label: "IgA anticardiolipin unit",
    description: "Measurement of IgA antibodies"
  },
  {
    code: "[APL'U]/mL",
    label: "IgA anticardiolipin unit per millilitre",
    description: "Measurement of IgA antibodies relative to millilitre"
  },
  {
    code: "[AU]",
    label: "allergy unit",
    description: "Related to allergy testing"
  },
  {
    code: "[CFU]",
    label: "colony forming unit",
    description:
      "Quantifies the number of viable cells capable of forming under specific conditions"
  },
  {
    code: "[CFU]/L",
    label: "colony forming unit per litre",
    description:
      "Quantifies the concentration of viable microorganisms in a liquid sample"
  },
  {
    code: "[CFU]/mL",
    label: "colony forming unit per millilitre",
    description:
      "Quantifies the concentration of viable microorganisms in a liquid sample"
  },
  {
    code: "[Ch]",
    label: "French (catheter gauge)",
    description: "Size or diameter of medical devices"
  },
  {
    code: "[GPL'U]",
    label: "IgG anticardiolipin unit",
    description: "Measurement of IgG class antibodies against cardiolipin"
  },
  {
    code: "[GPL'U]/mL",
    label: "IgG anticardiolipin unit per millilitre",
    description: "Concentration of IgG class antibodies per millilitre"
  },
  {
    code: "[HPF]",
    label: "high power field",
    description: "Area or field of view observed under a microscope"
  },
  {
    code: "[hp_C]",
    label: "homeopathic potency of centesimal hahnemannian series",
    description:
      "Common scale used to indicate the potency or dilution of homeopathic remedies"
  },
  {
    code: "[LPF]",
    label: "low power field",
    description:
      "Area or field of view observed under a microscope at a lower magnifaction "
  },
  {
    code: "[kp_C]",
    label: "homeopathic potency of centesimal korsakovian series",
    description: "Potency or dilution of homeopathic remedies"
  },
  {
    code: "[MPL'U]",
    label: "IgM anticardiolipin unit",
    description: "Refers to the measurement of IgM class antibodies"
  },
  {
    code: "[hp_X]",
    label: "homeopathic potency of decimal hahnemannian series",
    description: "Potency or dilution of homeopathic remedies"
  },
  {
    code: "[MPL'U]/mL",
    label: "IgM anticardiolipin unit per millilitre",
    description: "Concentration of IgM antibodies against cardiolipin "
  },
  {
    code: "[arb'U]",
    label: "arbitrary unit",
    description:
      "Used in various scientific fields to express a quantity or measurement that is not expressed in a specific unit of measurement"
  },
  {
    code: "[kp_X]",
    label: "homeopathic potency of decimal korsakovian series",
    description: "Potency or dilution of homeopathic remedies"
  },
  {
    code: "[arb'U]/mL",
    label: "arbitrary unit per millilitre",
    description: "Concentration of a substance in a liquid sample using arbitrary units "
  },
  {
    code: "[hp_M]",
    label: "homeopathic potency of millesimal hahnemannian series",
    description: "Potency or dilution of homeopathic remedies"
  },
  {
    code: "[bdsk'U]",
    label: "Bodansky unit",
    description:
      "Describes the activity of enzyme serum glutamic oxaloacetic transaminase"
  },
  {
    code: "[kp_M]",
    label: "homeopathic potency of millesimal korsakovian series",
    description: "Potency or dilution of homeopathic remedies"
  },
  {
    code: "[beth'U]",
    label: "Bethesda unit",
    description: "Concentration of anti-coagulation antibodies"
  },
  {
    code: "[hp_Q]",
    label: "homeopathic potency of quintamillesimal hahnemannian series",
    description: "Potency or dilution of homeopathic remedies"
  },
  {
    code: "[cin_i]",
    label: "cubic inch (international)",
    description: "Unit of volume"
  },
  {
    code: "[kp_Q]",
    label: "homeopathic potency of quintamillesimal korsakovian series",
    description: "Potency or dilution of homeopathic remedies"
  },
  {
    code: "[degF]",
    label: "degree Fahrenheit",
    description: "Measurement of temperature"
  },
  {
    code: "[dr_av]",
    label: "dram  (US and British)",
    description: "Measurement of volume"
  },
  {
    code: "[foz_us]",
    label: "fluid ounce (US)",
    description: "Measurement of volume"
  },
  {
    code: "[ft_i]",
    label: "foot (international)",
    description: "unit of length "
  },
  {
    code: "[gal_us]",
    label: "gallon (US)",
    description: "Measurement of volume"
  },
  {
    code: "[iU]/(2.h)",
    label: "international unit per 2 hour",
    description: "International unit rate of change over a 2 hour period"
  },
  {
    code: "[iU]/(24.h)",
    label: "international unit per 24 hour",
    description: "International unit rate of change over a 24 hour period"
  },
  {
    code: "[iU]/10*9{RBCs}",
    label: "international unit per billion red blood cells",
    description: "Concentration of certain substance in the blood"
  },
  {
    code: "[iU]/L",
    label: "international unit per litre",
    description: "Concentration of various substance in a liquid"
  },
  {
    code: "[iU]/L{37Cel}",
    label: "international unit per litre at 37 degrees Celsius",
    description: "Concentration of various substance in a liquid"
  },
  {
    code: "[iU]/d",
    label: "international unit per day",
    description: "Concentration of various substances in a liquid"
  },
  {
    code: "[iU]/dL",
    label: "international unit per decilitre",
    description: "Concentration of various substances in a liquid"
  },
  {
    code: "[iU]/g",
    label: "international unit per gram",
    description: "Concentration of various substances in a liquid"
  },
  {
    code: "[iU]/g{Hb}",
    label: "international unit per gram of hemoglobin",
    description:
      "Concentration of a factor in the blood relative to the amount of hemoglobin"
  },
  {
    code: "[iU]/h",
    label: "international unit per hour",
    description: "Rate of change of a substance within a specified period of one hour"
  },
  {
    code: "[iU]/kg/d",
    label: "international unit per kilogram per day",
    description:
      "Rate of a substance adminstered to an individual relative to body weight and duration "
  },
  {
    code: "[iU]/mL",
    label: "international unit per millilitre",
    description: "Concentration of various substances in a liquid"
  },
  {
    code: "[iU]/mg{creat}",
    label: "international unit per milligram of creatinine",
    description: "Concentration of various substances in urine"
  },
  {
    code: "[iU]/min",
    label: "international unit per minute",
    description: "Activity of substance over a period of 1 minute"
  },
  {
    code: "[in_i'H2O]",
    label: "inch (international) of water",
    description: "Depth of water"
  },
  {
    code: "[in_i]",
    label: "inch (international)",
    description: "Unit of length "
  },
  {
    code: "[IR]",
    label: "index of reactivity",
    description: "Scale on which chemicals are ranked on reactivity"
  },
  {
    code: "[ka'U]",
    label: "King Armstrong unit",
    description:
      "Amount of phosphate that releases 1 mg phenal from substrat at 37 degrees Celsius in 15 minutes"
  },
  {
    code: "[knk'U]",
    label: "Kunkel unit",
    description: "Level of antibody production or activity"
  },
  {
    code: "[Lf]",
    label: "Limit of flocculation",
    description: "Point at which colloidal particles begin to aggregate "
  },
  {
    code: "[lb_av]",
    label: "pound (US and British)",
    description: "Measure of mass"
  },
  {
    code: "[mi_i]",
    label: "mile (international)",
    description: "Measure of distance"
  },
  {
    code: "[oz_av]",
    label: "ounce (US and British)",
    description: "Measure of mass"
  },
  {
    code: "[oz_tr]",
    label: "Troy ounce",
    description: "Measure of mass"
  },
  {
    code: "[pH]",
    label: "pH",
    description: "Scale on which acids and bases are classified"
  },
  {
    code: "[ppb]",
    label: "part per billion",
    description: "Concentration of substance relative to 1 billion parts of a whole"
  },
  {
    code: "[ppm]",
    label: "part per million",
    description: "Concentration of substance relative to 1 million parts of a whole"
  },
  {
    code: "[ppm]{v/v}",
    label: "part per million in volume per volume",
    description:
      "Concentration of one substance in relation to one million parts of a whole relative to volume"
  },
  {
    code: "[ppth]",
    label: "part per thousand",
    description: "Concentration of substance relative to 1 thousand parts of a whole"
  },
  {
    code: "[pptr]",
    label: "part per trillion",
    description: "Concentration of substance relative to 1 trillion parts of a whole"
  },
  {
    code: "[psi]",
    label: "pound per square inch",
    description: "Unit of pressure"
  },
  { code: "[pt_us]", label: "pint (US)", description: "Unit of volume" },
  {
    code: "[PNU]",
    label: "protein nitrogen unit",
    description: "Protein content of milk"
  },
  {
    code: "[PFU]",
    label: "plaque forming units",
    description: "Quantify the number of infectious viral particles present in a sample"
  },
  { code: "[qt_us]", label: "quart (US)", description: "Unit of volume" },
  {
    code: "[sft_i]",
    label: "square foot (international)",
    description: "Unit of area"
  },
  {
    code: "[sin_i]",
    label: "square inch (international)",
    description: "Unit of area"
  },
  {
    code: "[syd_i]",
    label: "square yard (international)",
    description: "Unit of area"
  },
  {
    code: "[tb'U]",
    label: "tuberculin unit",
    description: "Potency of tuberculin "
  },
  {
    code: "[tbs_us]",
    label: "tablespoon (US)",
    description: "Unit of volume"
  },
  {
    code: "[USP'U]",
    label: "United States Pharmacopeia unit",
    description: "Potency of various pharmaceutical substances "
  },
  {
    code: "[todd'U]",
    label: "Todd unit",
    description: "One USP unit of vitamin D2 is equivalent to one International Unit (IU"
  },
  {
    code: "[tsp_us]",
    label: "teaspoon (US)",
    description: "Unit of volume"
  },
  {
    code: "[yd_i]",
    label: "yard (international)",
    description: "Unit of length"
  },
  { code: "a", label: "year", description: "Unit of time" },
  {
    code: "ag/{cells}",
    label: "attogram per cell",
    description: "Amount of substance within a single cell"
  },
  { code: "atm", label: "atmosphere", description: "Unit of pressure" },
  { code: "bar", label: "bar", description: "Unit of pressure" },
  { code: "cL", label: "centilitre", description: "Unit of volume" },
  {
    code: "cP",
    label: "centipoise",
    description: "Unit of dynamic viscosity"
  },
  {
    code: "cSt",
    label: "centistoke",
    description: "Unit of kinetmatic viscosity"
  },
  { code: "cal", label: "calorie", description: "Unit of energy" },
  {
    code: "cg",
    label: "centigram",
    description: "Metric unit of mass equivalent to 1/100 of a gram"
  },
  {
    code: "cm",
    label: "centimetre",
    description: "Metric unit of length equivalent to 1/100 of a metre"
  },
  {
    code: "cm2",
    label: "square centimetre",
    description: "Unit of area"
  },
  {
    code: "cm2/s",
    label: "square centimetre per second",
    description: "Unit of kinetmatic viscosity"
  },
  {
    code: "cm[H2O]",
    label: "centimetre of water",
    description: "Unit of pressure"
  },
  {
    code: "cm[H2O]/L/s",
    label: "centimetre of water per litre per second",
    description: "Used to measure the flow rate of a liquid"
  },
  {
    code: "cm[H2O]/s/m",
    label: "centimetre of water per second per metre",
    description: "Measure of flow resistance in a fluid over a distance"
  },
  {
    code: "cm[Hg]",
    label: "centimetre of mercury",
    description: "Unit of pressure"
  },
  { code: "d", label: "day", description: "Unit of time" },
  {
    code: "dB",
    label: "decibel",
    description: "Expresses the intensity of power of waveforms"
  },
  {
    code: "dL",
    label: "decilitre",
    description: "Metric unit of volume equivalent to 1/10 of a litre"
  },
  {
    code: "daL/min",
    label: "dekalitre per minute",
    description: "Unit of flow rate used to measure the volume of a liquid"
  },
  {
    code: "daL/min/m2",
    label: "dekalitre per minute per square metre",
    description: "Unit of flow rate per unit area of a liquid"
  },
  {
    code: "deg",
    label: "degree (plane angle)",
    description: "Unit of plane angle measurement"
  },
  {
    code: "deg/s",
    label: "degree per second",
    description: "Measurement of angular velocity"
  },
  {
    code: "dg",
    label: "decigram",
    description: "Metric unit of mass equivalent to 1/10 of a gram"
  },
  {
    code: "dm",
    label: "decimetre",
    description: "Metric unit of mass equivalent to 1/10 of a litre"
  },
  {
    code: "dm2/s2",
    label: "square decimetre per square second",
    description: "Unit of acceleration"
  },
  {
    code: "dyn.s/(cm.m2)",
    label: "dyne second per centimetre per square metre",
    description: "Unit of dynamic viscosity, a fluid's resistance to applied force (area)"
  },
  {
    code: "dyn.s/cm",
    label: "dyne second per centimetre",
    description: "Unit of dynamic viscosity, a fluid's resistance to applied forces"
  },
  {
    code: "eV",
    label: "electron Volt",
    description: "Unit of energy used in atomic physics"
  },
  {
    code: "eq",
    label: "equivalent",
    description: "Amount of substance that can react or combine with another substance"
  },
  {
    code: "eq/L",
    label: "equivalent per litre",
    description:
      "Amount of equivalents of a chemical species in solution per liter of that solution"
  },
  {
    code: "eq/mL",
    label: "equivalent per millilitre",
    description:
      "Amount of equivalents of a chemical species in solution per millilitre of that solution"
  },
  {
    code: "eq/mmol",
    label: "equivalent per millimole",
    description:
      "Amount of equivalents of a chemical species in solution per mllimole of that solution"
  },
  {
    code: "eq/umol",
    label: "equivalent per micromole",
    description:
      "Amount of equivalents of a chemical species in solution per mlcromole of that solution"
  },
  { code: "erg", label: "erg", description: "Unit of energy" },
  { code: "fL", label: "femtolitre", description: "Unit of volume" },
  { code: "fg", label: "femtogram", description: "Unit of mass" },
  { code: "fm", label: "femtometre", description: "Unit of length" },
  {
    code: "fmol",
    label: "femtomole",
    description: "Unit to quantify very small amount of substance"
  },
  {
    code: "fmol/L",
    label: "femtomole per litre",
    description: "Unit of concentration"
  },
  {
    code: "fmol/g",
    label: "femtomole per gram",
    description: "Unit of concentration"
  },
  {
    code: "fmol/mL",
    label: "femtomole per millilitre",
    description: "Unit of concentration"
  },
  {
    code: "fmol/mg",
    label: "femtomole per milligram",
    description: "Unit of concentration"
  },
  {
    code: "[FEU]",
    label: "fibrinogen equivalent unit",
    description: "Quantify the concentration of fibrinogen in blood"
  },
  {
    code: "fmol/mg{cyt_prot}",
    label: "femtomole per milligram of cytosol protein",
    description:
      "Unit of concentration used to expresss the amount of particular substance in a sample of cytosol protein"
  },
  {
    code: "fmol/mg{prot}",
    label: "femtomole per milligram of protein",
    description:
      "Unit of concentration used to express the amount of specific substance in a sample of protein"
  },
  { code: "g.m", label: "gram metre", description: "Unit torque" },
  {
    code: "g.m/{beat}",
    label: "gram metre per heart beat",
    description: "Unit of torque per heart beat"
  },
  {
    code: "g/(100.g)",
    label: "gram per 100 gram",
    description: "Percentage of one substance within another substance on a mass basis"
  },
  {
    code: "g/(12.h)",
    label: "gram per 12 hour",
    description: "Measure of mass per 12 hours"
  },
  {
    code: "g/(24.h)",
    label: "gram per 24 hour",
    description: "Measure of mass per 24 hours"
  },
  {
    code: "g/(3.d)",
    label: "gram per 3 days",
    description: "Measure of mass per 23 days"
  },
  {
    code: "g/(4.h)",
    label: "gram per 4 hour",
    description: "Measure of mass per4 hours"
  },
  {
    code: "g/(48.h)",
    label: "gram per 48 hour",
    description: "Measure of mass per 48 hours"
  },
  {
    code: "g/(5.h)",
    label: "gram per 5 hour",
    description: "Measure of mass per 5 hours"
  },
  {
    code: "g/(6.h)",
    label: "gram per 6 hour",
    description: "Measure of mass per 6 hours"
  },
  {
    code: "g/(72.h)",
    label: "gram per 72 hour",
    description: "Measure of mass per 72 hours"
  },
  {
    code: "g/(8.h){shift}",
    label: "gram per 8 hour shift",
    description: "Measure of mass per 8 hour work shift"
  },
  {
    code: "g/L",
    label: "gram per litre",
    description: "Rate of mass per volume"
  },
  {
    code: "g/cm3",
    label: "gram per cubic centimetre",
    description: "Rate of mass per volume"
  },
  {
    code: "g/d",
    label: "gram per day",
    description: "Rate of mass per day"
  },
  {
    code: "g/dL",
    label: "gram per decilitre",
    description: "Rate of mass per"
  },
  {
    code: "g/g",
    label: "gram per gram",
    description: "Rate of mass per volume"
  },
  {
    code: "g/g{creat}",
    label: "gram per gram of creatinine",
    description:
      "Unit of measurement used in clinical analyses and expresses the concentration of substances in urine relative to the concentration of creatine in the same urine sample"
  },
  {
    code: "g/g{globulin}",
    label: "gram per gram of globulin",
    description:
      "Unit of concentration of a specific substance in a sample relative to the concentration of globulin in the same sample"
  },
  {
    code: "g/g{tissue}",
    label: "gram per gram of tissue",
    description:
      "Concentration of a substance in a sample relative to the concentration of tissue in the same sample"
  },
  {
    code: "g/h",
    label: "gram per hour",
    description: "Measure of mass per hour"
  },
  {
    code: "g/h/m2",
    label: "gram per hour per square metre",
    description: "Rate of mass transfer per unit area over a specific time interval"
  },
  {
    code: "g/kg",
    label: "gram per kilogram",
    description:
      "Unit of measurement that expresses the concentration of a substance in a mixture"
  },
  {
    code: "g/kg/(8.h)",
    label: "gram per  kilogram per 8 hour",
    description:
      "Rate of mass transfer over a specific time period mass relative to kilograms"
  },
  {
    code: "g/kg/(8.h){shift}",
    label: "gram per kilogram per 8 hour shift",
    description:
      "Rate of mass transfer over a specific time period mass relative to kilograms"
  },
  {
    code: "g/kg/d",
    label: "gram per kilogram per day",
    description:
      "Rate of mass transfer over a specific time period mass relative to kilograms"
  },
  {
    code: "g/kg/h",
    label: "gram per kilogram per hour",
    description:
      "Rate of mass transfer over a specific time period mass relative to kilograms"
  },
  {
    code: "g/kg/min",
    label: "gram per kilogram per minute",
    description:
      "Rate of mass transfer over a specific time period mass relative to kilograms"
  },
  {
    code: "g/m2",
    label: "gram per square metre",
    description: "Mass per unit area"
  },
  {
    code: "g/mL",
    label: "gram per millilitre",
    description: "Unit of density"
  },
  {
    code: "g/mg",
    label: "gram per milligram",
    description: "Ratio of grams to milligrams"
  },
  {
    code: "g/min",
    label: "gram per minute",
    description: "Rate of mass relative to time"
  },
  {
    code: "g/mmol",
    label: "gram per millimole",
    description: "Molar mass"
  },
  {
    code: "g/mol{creat}",
    label: "gram per mole of creatinine",
    description: "Mass relative to amount of creatinine"
  },
  {
    code: "g/{specimen}",
    label: "gram per specimen",
    description: "Measure of mass"
  },
  {
    code: "g/{total_output}",
    label: "gram per total output",
    description: "Measure of mass relative to the final results"
  },
  {
    code: "g/{total_weight}",
    label: "gram per total weight",
    description: "Meaure of mass relative to the total sample mass"
  },
  {
    code: "g{Hb}",
    label: "gram of hemoglobin",
    description: "Mass of hemoglobin"
  },
  { code: "g%", label: "gram percent", description: "Ratio of grams " },
  {
    code: "g{creat}",
    label: "gram of creatinine",
    description: "Mass of creatinine"
  },
  {
    code: "g{total_nit}",
    label: "gram of total nitrogen",
    description: "Quantifies the amount of nitrogen contained within a sample"
  },
  {
    code: "g{total_prot}",
    label: "gram of total protein",
    description: "Quantifies the amount of protein contained within a sample"
  },
  {
    code: "g{wet_tissue}",
    label: "gram of wet tissue",
    description: "Quantifies the amount of wet tissue wihin a sample"
  },
  { code: "h", label: "hour", description: "Unit of time" },
  { code: "kL", label: "kilolitre", description: "Unit of volume" },
  { code: "kPa", label: "kilopascal", description: "Unit of pressure" },
  {
    code: "kU",
    label: "kilo enzyme unit",
    description: "Concentration of an enzyme in solution"
  },
  {
    code: "kU/L",
    label: "kilo enzyme unit per litre",
    description: "Concentration of an enzyme in solution relative to one litre"
  },
  {
    code: "kU/L{class}",
    label: "kilo enzyme unit per litre class",
    description: "Concentration of enzymes present in one litre of solution"
  },
  {
    code: "kU/g",
    label: "kilo enzyme unit per gram",
    description: "Concentration of enzymes present in one gram of substance"
  },
  {
    code: "kU/mL",
    label: "kilo enzyme unit per millilitre",
    description: "Concentration of enzymes present in one millitre of solution"
  },
  {
    code: "k[iU]/L",
    label: "kilo international unit per litre",
    description: "Unit of concentration"
  },
  {
    code: "k[iU]/mL",
    label: "kilo international unit per millilitre",
    description: "Unit of concentration"
  },
  {
    code: "kat",
    label: "katal",
    description: "Unit of measurement for catalytic activity"
  },
  {
    code: "kat/L",
    label: "katal per litre",
    description: "Catalytic activity per litre"
  },
  {
    code: "kat/kg",
    label: "katal per kilogram",
    description: "Catalytic activity per kilogram"
  },
  { code: "kcal", label: "kilocalorie", description: "Unit of energy" },
  {
    code: "kcal/[oz_av]",
    label: "kilocalorie per ounce (US and British)",
    description: "Unit of energy per unit mass"
  },
  {
    code: "kcal/d",
    label: "kilocalorie per day",
    description: "Rate of energy expenditure per unit time"
  },
  {
    code: "kcal/h",
    label: "kilocalorie per hour",
    description: "Rate of energy expenditure per unit time"
  },
  {
    code: "kcal/kg/(24.h)",
    label: "kilocalorie per kilogram per 24 hour",
    description: "Rate of energy expenditure per unit mass per unit time"
  },
  {
    code: "kg.m/s",
    label: "kilogram metre per second",
    description: "Measurement of momentum"
  },
  {
    code: "kg/(s.m2)",
    label: "kilogram per second per square metre",
    description: "Rate of mass flow per unit area"
  },
  {
    code: "kg/L",
    label: "kilogram per litre",
    description: "Unit of density"
  },
  {
    code: "kg/h",
    label: "kilogram per hour",
    description: "Rate of mass transfer over a specific time period "
  },
  {
    code: "kg/m2",
    label: "kilogram per square metre",
    description: "Unit of surface density"
  },
  {
    code: "kg/m3",
    label: "kilogram per cubic metre",
    description: "Unit of density"
  },
  {
    code: "kg/min",
    label: "kilogram per minute",
    description: "Rate of mass transfer over a specific time period "
  },
  {
    code: "kg/mol",
    label: "kilogram per mole",
    description: "Expresses the molar mass of a substance"
  },
  {
    code: "kg/s",
    label: "kilogram per second",
    description: "Rate of mass transfer over a specific time period "
  },
  { code: "km", label: "kilometre", description: "Unit of length" },
  { code: "ks", label: "kilosecond", description: "Unit of time" },
  {
    code: "lm",
    label: "lumen",
    description: "SI unit for luminous flux"
  },
  {
    code: "lm.m2",
    label: "lumen square metre",
    description:
      "Unit of measurment used to express the illumamincance or brightness level on a surface "
  },
  { code: "m", label: "metre", description: "Unit of length" },
  {
    code: "m/s",
    label: "metre per second",
    description: "Expresses magnitude of velocity"
  },
  {
    code: "m/s2",
    label: "metre per square second",
    description: "Expresses magnitude of accelertation"
  },
  { code: "m2", label: "square metre", description: "Unit of area" },
  {
    code: "m2/s",
    label: "square metre per second",
    description: "Rate of change in area relative to unit time"
  },
  {
    code: "m3/s",
    label: "cubic metre per second",
    description: "Rate of change in volume relative to unit time"
  },
  {
    code: "mA",
    label: "milliampere",
    description: "Unit of electrical current equal to 1/1000 of an ampere"
  },
  {
    code: "mL/(10.h)",
    label: "millilitre per 10 hour",
    description: "Measure of volume relative to time"
  },
  {
    code: "mL/(12.h)",
    label: "millilitre per 12 hour",
    description: "Measure of volume relative to time"
  },
  {
    code: "mL/(2.h)",
    label: "millilitre per 2 hour",
    description: "Measure of volume relative to time"
  },
  {
    code: "mL/(24.h)",
    label: "millilitre per 24 hour",
    description: "Measure of volume relative to time"
  },
  {
    code: "mL/(4.h)",
    label: "millilitre per 4 hour",
    description: "Measure of volume relative to time"
  },
  {
    code: "mL/(5.h)",
    label: "millilitre per 5 hour",
    description: "Measure of volume relative to time"
  },
  {
    code: "mL/(6.h)",
    label: "millilitre per 6 hour",
    description: "Measure of volume relative to time"
  },
  {
    code: "mL/(72.h)",
    label: "millilitre per 72 hour",
    description: "Measure of volume relative to time"
  },
  {
    code: "mL/(8.h)",
    label: "millilitre per 8 hour",
    description: "Measure of volume relative to time"
  },
  {
    code: "mL/(8.h)/kg",
    label: "millilitre per 8 hour per kilogram",
    description: "Express the rate of fluid infusion"
  },
  {
    code: "mL/[sin_i]",
    label: "millilitre per square inch (international)",
    description: "Volume relative to unit area"
  },
  {
    code: "mL/cm[H2O]",
    label: "millilitre per centimetre of water",
    description: "Unit of measurement used to express the volume flow rate of a liquid"
  },
  {
    code: "mL/d",
    label: "millilitre per day",
    description: "Measure of volume relative to time"
  },
  {
    code: "mL/dL",
    label: "millilitre per decilitre",
    description: "Ratio of millilitres to decilitres"
  },
  {
    code: "mL/h",
    label: "millilitre per hour",
    description: "Measure of volume relative to time"
  },
  {
    code: "mL/kg",
    label: "millilitre per kilogram",
    description: "Ratio of volume to mass"
  },
  {
    code: "mL/kg/(8.h)",
    label: "millilitre per kilogram per 8 hour",
    description: "Ratio of volume to mass relative to time"
  },
  {
    code: "mL/kg/d",
    label: "millilitre per kilogram per day",
    description: "Ratio of volume to mass relative to time"
  },
  {
    code: "mL/kg/h",
    label: "millilitre per kilogram per hour",
    description: "Ratio of volume to mass relative to time"
  },
  {
    code: "mL/kg/min",
    label: "millilitre per kilogram per minute",
    description: "Ratio of volume to mass relative to time"
  },
  {
    code: "mL/m2",
    label: "millilitre per square metre",
    description: "Ratio of volume to area"
  },
  {
    code: "mL/mbar",
    label: "millilitre per millibar",
    description: "Ratio of volume to pressure"
  },
  {
    code: "mL/min",
    label: "millilitre per minute",
    description: "Rate of volmue relative to time"
  },
  {
    code: "mL/min/m2",
    label: "millilitre per minute per square metre",
    description: "Rate of volume relative to time per unit area"
  },
  {
    code: "mL/min/{1.73_m2}",
    label: "millilitre per minute per 1.73 square metre",
    description:
      "Unit of measure used in medical contexts to express a rate of filtration by the kidneys"
  },
  {
    code: "mL/mm",
    label: "millilitre per millimetre",
    description: "Volume to length ratio"
  },
  {
    code: "mL/s",
    label: "millilitre per second",
    description: "Expresses flow rate"
  },
  {
    code: "mL/{beat}",
    label: "millilitre per heart beat",
    description: "Unit of volume relative to heart beat"
  },
  {
    code: "mL/{beat}/m2",
    label: "millilitre per heart beat per  square metre",
    description: "Stroke volume index "
  },
  {
    code: "mL{fetal_RBCs}",
    label: "millilitre of fetal red blood cells",
    description: "Volume of fetal red blood cells"
  },
  { code: "mPa", label: "millipascal", description: "Unit of pressure" },
  {
    code: "mPa.s",
    label: "millipascal second",
    description: "Unit of dynamic viscosity"
  },
  {
    code: "mU/L",
    label: "milli enzyme unit per litre",
    description: "Concentration of an enzyme in a solution "
  },
  {
    code: "mU/g",
    label: "milli  enzyme unit per gram",
    description: "Concentration of an enzyme in a solution or substance"
  },
  {
    code: "mU/g{Hb}",
    label: "milli enzyme unit per gram of hemoglobin",
    description:
      "Concentration of an enzyme in relation to the amount of hemoglobin present in a sample"
  },
  {
    code: "mU/g{prot}",
    label: "milli enzyme unit per gram of protein",
    description:
      "Concentration of an enzyme in relation to the amount of protein present in a sample"
  },
  {
    code: "mU/mL",
    label: "milli  enzyme unit per millilitre",
    description: "Concentration of an enzyme in solution"
  },
  {
    code: "mU/mL/min",
    label: "milli  enzyme unit per millilitre per minute",
    description: "Concentration of an enzyme in solution relative to the time "
  },
  {
    code: "mU/mg",
    label: "milli enzyme unit per milligram",
    description: "Concentration of an enzyme in solution"
  },
  {
    code: "mU/mg{creat}",
    label: "milli enzyme unit per milligram of creatinine",
    description:
      "Concentration of an enzyme relative to the amount of creatine in a sample"
  },
  {
    code: "mU/mmol{RBCs}",
    label: "milli  enzyme unit per millimole of red blood cells",
    description:
      "Concentration of an enzyme relative to the amount of red blood cells in a sample"
  },
  {
    code: "mU/mmol{creat}",
    label: "milli  enzyme unit per millimole of creatinine",
    description:
      "Concentration of an enzyme relative to the amount of creatinine in a sample"
  },
  {
    code: "mV",
    label: "millivolt",
    description: "Unit of electrical potential difference"
  },
  {
    code: "m[iU]/L",
    label: "milli-international unit per litre",
    description: "Concentration of biologically active compounds in a liquid sample"
  },
  {
    code: "m[iU]/mL",
    label: "milli -international unit per millilitre",
    description: "Concentration of biologically active compounds in a liquid sample"
  },
  { code: "mbar", label: "millibar", description: "Unit of pressure" },
  {
    code: "mbar.s/L",
    label: "millibar second per litre",
    description: "Unit of viscosity"
  },
  {
    code: "mbar/L/s",
    label: "millibar per litre per second",
    description: "Rate of change of a pressure drop "
  },
  {
    code: "meq/(2.h)",
    label: "milliequivalent per 2 hour",
    description: "Concentration of ions in solution over time period"
  },
  {
    code: "meq/(24.h)",
    label: "milliequivalent per 24 hour",
    description: "Concentration of ions in solution over time period"
  },
  {
    code: "meq/(8.h)",
    label: "milliequivalent per 8 hour",
    description: "Concentration of ions in solution over time period"
  },
  {
    code: "meq/L",
    label: "milliequivalent per litre",
    description: "Concentration of ions in solution "
  },
  {
    code: "meq/d",
    label: "milliequivalent per day",
    description: "Concentration of ions in solution over time period"
  },
  {
    code: "meq/dL",
    label: "milliequivalent per decilitre",
    description: "Concentration of ions in solution "
  },
  {
    code: "meq/g",
    label: "milliequivalent per gram",
    description: "Concentration of ions relative to mass"
  },
  {
    code: "meq/g{creat}",
    label: "milliequivalent per gram of creatinine",
    description: "Concentration of ions relative to the mass of creatinine"
  },
  {
    code: "meq/h",
    label: "milliequivalent per hour",
    description: "Concentration of ions in solution over time period"
  },
  {
    code: "meq/kg",
    label: "milliequivalent per kilogram",
    description: "Concentration of ions relative to mass"
  },
  {
    code: "meq/kg/h",
    label: "milliequivalent per kilogram per hour",
    description:
      "Rate of administration, consumption, or change in concentration of ions in relation to a person's body weight over a one hour period"
  },
  {
    code: "meq/m2",
    label: "milliequivalent per square metre",
    description: "Concentration of ions in a specific area"
  },
  {
    code: "meq/mL",
    label: "milliequivalent per millilitre",
    description: "Concentration of ions within a millitre"
  },
  {
    code: "meq/min",
    label: "milliequivalent per minute",
    description:
      "Rate of change in concentration of ions in a solution over a one-minute period"
  },
  {
    code: "meq/{specimen}",
    label: "milliequivalent per specimen",
    description: "Concentration or quantity of ions in a single test specimen"
  },
  {
    code: "meq/{total_volume}",
    label: "milliequivalent per total volume",
    description:
      "Concentration of ions in solution relative to the total volume of a sample"
  },
  {
    code: "mg/(10.h)",
    label: "milligram per 10 hour",
    description: "Rate of change of a substance's mass"
  },
  {
    code: "mg/(12.h)",
    label: "milligram per 12 hour",
    description: "Rate of change of a substance's mass"
  },
  {
    code: "mg/(2.h)",
    label: "milligram per 2 hour",
    description: "Rate of change of a substance's mass"
  },
  {
    code: "mg/(24.h)",
    label: "milligram per 24 hour",
    description: "Rate of change of a substance's mass"
  },
  {
    code: "mg/(6.h)",
    label: "milligram per 6 hour",
    description: "Rate of change of a substance's mass"
  },
  {
    code: "mg/(72.h)",
    label: "milligram per 72 hour",
    description: "Rate of change of a substance's mass"
  },
  {
    code: "mg/(8.h)",
    label: "milligram per 8 hour",
    description: "Rate of change of a substance's mass"
  },
  {
    code: "mg/L",
    label: "milligram per litre",
    description: "Unit of concentration"
  },
  {
    code: "mg/L{RBCs}",
    label: "milligram per litre of red blood cells",
    description: "Concentration of a substance in a sample of red blood cells"
  },
  {
    code: "mg/d",
    label: "milligram per day",
    description: "Rate of change of a substance's mass"
  },
  {
    code: "mg/d/{1.73_m2}",
    label: "milligram per day per 1.73 square metre",
    description:
      "Rate of substance accumulation in a specified area over the course of a day"
  },
  {
    code: "mg/dL",
    label: "milligram per decilitre",
    description: "Unit of concentration"
  },
  {
    code: "mg/dL{RBCs}",
    label: "milligram per decilitre of red blood cells",
    description: "Concentration of a substance in a sample of red blood cells"
  },
  {
    code: "mg/g",
    label: "milligram per gram",
    description: "Ratio of milligram to gram"
  },
  {
    code: "mg/g{creat}",
    label: "milligram per gram of creatinine",
    description: "Ratio of milligrams of one substance relative to the mass of creatinine"
  },
  {
    code: "mg/g{dry_tissue}",
    label: "milligram per gram of dry tissue",
    description: "Ratio of milligrams of one substance relative to the mass of dry tissue"
  },
  {
    code: "mg/g{feces}",
    label: "milligram per gram of feces",
    description:
      "Ratio of milligrams of one substance relative to the mass of fecal matter"
  },
  {
    code: "mg/g{tissue}",
    label: "milligram per gram of tissue",
    description: "Ratio of milligrams of one substance relative to the mass of tissue"
  },
  {
    code: "mg/g{wet_tissue}",
    label: "milligram per gram of wet tissue",
    description: "Ratio of milligrams of one substance relative to the mass of wet tissue"
  },
  {
    code: "mg/h",
    label: "milligram per hour",
    description: "Rate of change of a substance's mass"
  },
  {
    code: "mg/kg/(8.h)",
    label: "milligram per kilogram per 8 hour",
    description: "Ratio of masses rate of change"
  },
  {
    code: "mg/kg/d",
    label: "milligram per kilogram per day",
    description: "Ratio of masses rate of change"
  },
  {
    code: "mg/kg/h",
    label: "milligram per kilogram per hour",
    description: "Ratio of masses rate of change"
  },
  {
    code: "mg/kg/min",
    label: "milligram per kilogram per minute",
    description: "Ratio of masses rate of change"
  },
  {
    code: "mg/m3",
    label: "milligram per cubic metre",
    description: "Concentration of a substance in particulate media"
  },
  {
    code: "mg/mL",
    label: "milligram per millilitre",
    description: "Concentration of a substance in a liquid solution"
  },
  {
    code: "mg/mg",
    label: "milligram per milligram",
    description: "Ratio of masses "
  },
  {
    code: "mg/mg{creat}",
    label: "milligram per milligram of creatinine",
    description:
      "concentration or quantity of a substance relative to the amount of creatinine present in a sample"
  },
  {
    code: "mg/min",
    label: "milligram per minute",
    description: "Rate of change of a substance's mass"
  },
  {
    code: "mg/mmol",
    label: "milligram per millimole",
    description: "Molar mass"
  },
  {
    code: "mg/mmol{creat}",
    label: "milligram per millimole of creatinine",
    description:
      "Concentration of mass relative to the amount of creatinine in the sample"
  },
  {
    code: "mg/wk",
    label: "milligram per week",
    description: "Rate of change of a substance's mass "
  },
  {
    code: "mg/{collection}",
    label: "milligram per collection",
    description: "Measurement of mass"
  },
  {
    code: "mg/{specimen}",
    label: "milligram per specimen",
    description: "Measurement of mass"
  },
  {
    code: "mg/{total_output}",
    label: "milligram per total output",
    description: "Measurement of mass"
  },
  {
    code: "mg/{total_volume}",
    label: "milligram per total volume",
    description: "Measurement of mass"
  },
  {
    code: "mg{FEU}/L",
    label: "milligram fibrinogen equivalent unit per litre",
    description: "Concentration of fibrinogen in a liquid sample"
  },
  { code: "min", label: "minute", description: "Unit of time" },
  { code: "mm", label: "millimetre", description: "Unit of volume" },
  {
    code: "mm/h",
    label: "millimetre per hour",
    description: "Rate of change in volume"
  },
  {
    code: "mm/min",
    label: "millimetre per minute",
    description: "Rate of change in volume"
  },
  {
    code: "mm2",
    label: "square millimetre",
    description: "Unit of area"
  },
  {
    code: "mm[H2O]",
    label: "millimetre of water",
    description: "Volume of water"
  },
  {
    code: "mm[Hg]",
    label: "millimetre of mercury",
    description: "Height of a column of mercury supported by a specific pressure"
  },
  {
    code: "mmol/(12.h)",
    label: "millimole per 12 hour",
    description: "Rate of change of a substance over a time period"
  },
  {
    code: "mmol/(2.h)",
    label: "millimole per 2 hour",
    description: "Rate of change of a substance over a time period"
  },
  {
    code: "mmol/(24.h)",
    label: "millimole per 24 hour",
    description: "Rate of change of a substance over a time period"
  },
  {
    code: "mmol/(5.h)",
    label: "millimole per 5 hour",
    description: "Rate of change of a substance over a time period"
  },
  {
    code: "mmol/(6.h)",
    label: "millimole per 6 hour",
    description: "Rate of change of a substance over a time period"
  },
  {
    code: "mmol/(8.h)",
    label: "millimole per 8 hour",
    description: "Rate of change of a substance over a time period"
  },
  {
    code: "mmol/L",
    label: "millimole per litre",
    description: "Unit of concentration"
  },
  {
    code: "mmol/L{RBCs}",
    label: "millimole per litre of red blood cells",
    description: "Unit of concentration"
  },
  {
    code: "mmol/d",
    label: "millimole per day",
    description: "Rate of concentration"
  },
  {
    code: "mmol/dL",
    label: "millimole per decilitre",
    description: "Concentration of various substances in a liquid"
  },
  {
    code: "mmol/g",
    label: "millimole per gram",
    description: "Unit of concentration "
  },
  {
    code: "mmol/g{creat}",
    label: "millimole per gram of creatinine",
    description:
      "Unit of concentration of mole of a substance relative to the amount of creatinine"
  },
  {
    code: "mmol/h",
    label: "millimole per hour",
    description: "Rate of concentration"
  },
  {
    code: "mmol/h/mg{Hb}",
    label: "millimole per hour per milligram of hemoglobin",
    description:
      "Unit of measurement that expresses the rate at which a substance is either consumed or produced per unit of hemoglobin mass"
  },
  {
    code: "mmol/h/mg{prot}",
    label: "millimole per hour per milligram of protein",
    description:
      "Rate at which a substance is either consumed or produce per unit of protein mass"
  },
  {
    code: "mmol/kg",
    label: "millimole per kilogram",
    description: "Unit of concentration"
  },
  {
    code: "mmol/kg/(8.h)",
    label: "millimole per kilogram per 8 hour",
    description: "Rate of change in concentration of a substance "
  },
  {
    code: "mmol/kg/d",
    label: "millimole per kilogram per day",
    description: "Rate of change in concentration of a substance "
  },
  {
    code: "mmol/kg/h",
    label: "millimole per kilogram per hour",
    description: "Rate of change in concentration of a substance "
  },
  {
    code: "mmol/kg/min",
    label: "millimole per kilogram per minute",
    description: "Rate of change in concentration of a substance "
  },
  {
    code: "mmol/m2",
    label: "millimole per square metre",
    description: "Concentration of a substance in a certain area"
  },
  {
    code: "mmol/min",
    label: "millimole per minute",
    description: "Rate of change in concentration of a substance "
  },
  {
    code: "mmol/mmol",
    label: "millimole per millimole",
    description: "Ratio of concentrations"
  },
  {
    code: "mmol/mmol{creat}",
    label: "millimole per millmole of creatinine",
    description: "Ratio of one substance to the amount of creatinine in the sample"
  },
  {
    code: "mmol/mmol{urea}",
    label: "millimole per millimole of urea",
    description: "Ratio of one substance to the amount of urea in a sample"
  },
  {
    code: "mmol/mol",
    label: "millimole per mole",
    description:
      "Ratio of the amount of one substance to the total amount of the entire mixture"
  },
  {
    code: "mmol/mol{creat}",
    label: "millimole per mole of creatinine",
    description: "Ratio of one substance to the amount of creatinine in the sample"
  },
  {
    code: "mmol/s/L",
    label: "millimole per second per litre",
    description:
      "Rate of change in the concentration of a substance in a liquid over time, relative to the volume of the liquid"
  },
  {
    code: "mmol/{ejaculate}",
    label: "millimole per ejaculate",
    description: "Concentration of substance in male's ejaculate"
  },
  {
    code: "mmol/{specimen}",
    label: "millimole per specimen",
    description: "Concentration of substance per some specimen"
  },
  {
    code: "mmol/{total_vol}",
    label: "millimole per total volume",
    description: "Unit of concentration"
  },
  { code: "mo", label: "month", description: "Unit of time" },
  { code: "mol/L", label: "mole per litre", description: "Molarity" },
  {
    code: "mol/kg",
    label: "mole per kilogram",
    description: "Molar mass"
  },
  {
    code: "mol/kg/s",
    label: "mole per kilogram per second",
    description: "Rate of change in molar mass"
  },
  {
    code: "mol/m3",
    label: "mole per cubic metre",
    description: "Unit of concentration"
  },
  {
    code: "mol/mL",
    label: "mole per millilitre",
    description: "Unit of concentration"
  },
  {
    code: "mol/mol",
    label: "mole per mole",
    description: "Ratio of moles"
  },
  {
    code: "mol/s",
    label: "mole per second",
    description: "Rate of change in moles"
  },
  {
    code: "mosm",
    label: "milliosmole",
    description: "Expresses the osmolarity of solution"
  },
  {
    code: "mosm/L",
    label: "milliosmole per litre",
    description: "Expresses the osmolarity of solution relative to it's volume"
  },
  {
    code: "mosm/kg",
    label: "milliosmole per kilogram",
    description: "Osmolarity of solution relative to it's mass"
  },
  { code: "ms", label: "millisecond", description: "Unit of time" },
  { code: "nL", label: "nanolitre", description: "Unit of volume" },
  {
    code: "nU/mL",
    label: "nanoenzyme unit per millilitre",
    description: "Activity of nanoenzyme in solution"
  },
  {
    code: "nU/{RBC}",
    label: "nanoenzyme unit per red blood cell",
    description: "Activity of nanoenzyme relative to the red blood cells"
  },
  {
    code: "ng/(24.h)",
    label: "nanogram per 24 hour",
    description: "Rate at which a substance is either produced or excreted from a system"
  },
  {
    code: "ng/(8.h)",
    label: "nanogram per 8 hour",
    description: "Rate at which a substance is either produced or excreted from a system"
  },
  {
    code: "ng/10*6",
    label: "nanogram per million",
    description: "Rate at which a substance is either produced or excreted from a system"
  },
  {
    code: "ng/10*6{RBCs}",
    label: "nanogram per million red blood cells",
    description:
      "Concentration or quantity of a substance in terms of nanograms per million red blood cells "
  },
  {
    code: "ng/L",
    label: "nanogram per litre",
    description: "Concentration of a substance in a liquid solution"
  },
  {
    code: "ng/U",
    label: "nanogram per enzyme unit",
    description: "Amount of substance in nanograms per enzyme unit"
  },
  {
    code: "ng/d",
    label: "nanogram per day",
    description: "Rate at which a substance is either produced or excreted from a system"
  },
  {
    code: "ng/dL",
    label: "nanogram per decilitre",
    description: "Concentration of a substance in a liquid solution"
  },
  {
    code: "ng/g",
    label: "nanogram per gram",
    description:
      "Amount of dissolved substance in the liquid relative to the mass of the liquid"
  },
  {
    code: "ng/g{creat}",
    label: "nanogram per gram of creatinine",
    description:
      "Concentration or quantity of a substance relative to the amount of creatinine in a sample"
  },
  {
    code: "ng/h",
    label: "nanogram per hour",
    description: "Rate of production, comsuption, or administration over a time period"
  },
  {
    code: "ng/kg",
    label: "nanogram per kilogram",
    description:
      "Concentration of a substance relative to the mass of the entire material"
  },
  {
    code: "ng/kg/(8.h)",
    label: "nanogram per kilogram per 8 hour",
    description:
      "Rate of change of the concentration of a substance relative to the mass of the entire material"
  },
  {
    code: "ng/kg/h",
    label: "nanogram per kilogram per hour",
    description:
      "Rate of change of the concentration of a substance relative to the mass of the entire material"
  },
  {
    code: "ng/kg/min",
    label: "nanogram per kilogram per minute",
    description:
      "Rate of change of the concentration of a substance relative to the mass of the entire material"
  },
  {
    code: "ng/m2",
    label: "nanogram per square metre",
    description: "Concentration of a substance in a certain area"
  },
  {
    code: "ng/mL",
    label: "nanogram per millliiter",
    description: "Concentration of a substance in a liquid solution"
  },
  {
    code: "ng/mL/h",
    label: "nanogram per millilitre per hour",
    description: "Rate of change in concentration of a substance "
  },
  {
    code: "ng/mL{RBCs}",
    label: "nanogram per millilitre of red blood cells",
    description:
      "Express the concentration or quantity of a substance within red blood cells in a liquid sample"
  },
  {
    code: "ng/mg",
    label: "nanogram per milligram",
    description:
      "Concentration of a substance in a material relative to the mass of that material"
  },
  {
    code: "ng/mg/h",
    label: "nanogram per milligram per hour",
    description: "Rate of production, comsuption, or administration over a time period"
  },
  {
    code: "ng/mg{creat}",
    label: "nanogram per milligram of creatinine",
    description: "Concentration of a substance in a urine "
  },
  {
    code: "ng/mg{prot}",
    label: "nanogram per milligram of protein",
    description: "Concentration of a substance in a protein sample"
  },
  {
    code: "ng/min",
    label: "nanogram per minute",
    description: "Rate of change of a substance in a system "
  },
  {
    code: "ng/s",
    label: "nanogram per second",
    description: "Rate of change of a substance in a system "
  },
  {
    code: "ng{FEU}/mL",
    label: "nanogram fibrinogen equivalent unit per millilitre",
    description: "Concentration of fibrinogen in a blood sample"
  },
  {
    code: "nkat",
    label: "nanokatal",
    description: "Unit for enzymatic activity"
  },
  { code: "nm", label: "nanometre", description: "Unit of length" },
  {
    code: "nm/s/L",
    label: "nanometre per second per litre",
    description: "Velocity of particles through a fluid"
  },
  {
    code: "nmol",
    label: "nanomole",
    description: "Quantity of a substance "
  },
  {
    code: "nmol/(24.h)",
    label: "nanomole per 24 hour",
    description: "Rate of change of the quantity of the substance"
  },
  {
    code: "nmol/L",
    label: "nanomole per litre",
    description: "Molarity"
  },
  {
    code: "nmol/L/mmol{creat}",
    label: "nanomole per litre per millimole of creatinine",
    description:
      "Concentration of a specific substance in urine adjusted for the concentration of the creatinine in the sample"
  },
  {
    code: "nmol/L{RBCs}",
    label: "nanomole per litre of red blood cells",
    description: "Concentration of a specific substance within red blood cells"
  },
  {
    code: "nmol/d",
    label: "nanomole per day",
    description: "Rate of change of a substance in a system "
  },
  {
    code: "nmol/dL",
    label: "nanomole per decilitre",
    description: "Molarity"
  },
  {
    code: "nmol/dL{GF}",
    label: "nanomole per decilitre of glomerular filtrate",
    description:
      "Concentration of a particular substance in nanomoles per deciliter of the glomerular filtrate"
  },
  {
    code: "nmol/g",
    label: "nanomole per gram",
    description: "Concentration of a substance in a sample, typically on a mass basis"
  },
  {
    code: "nmol/g{creat}",
    label: "nanomole per gram of creatinine",
    description:
      "Concentration of a specific substance in urine or other biological samples, normalized for the concentration of creatinine in the same sample"
  },
  {
    code: "nmol/g{dry_wt}",
    label: "nanomole per gram of dry weight",
    description:
      "Concentration of a substance in a sample normalized for the dry weight of the sample"
  },
  {
    code: "nmol/h/L",
    label: "nanomole per hour per litre",
    description: "Rate of change of a substance in a system "
  },
  {
    code: "nmol/h/mg{prot}",
    label: "nanomole per hour per milligram of protein",
    description: "Rate of change of an enzymatic reaction "
  },
  {
    code: "nmol/m/mg{prot}",
    label: "nanomole per metre per milligram of protein",
    description:
      "Rate of change of a substance within a biological system, normalized by both the amount of protein in that system and the distance over which it occurs"
  },
  {
    code: "nmol/mL",
    label: "nanomole per millilitre",
    description: "Molarity"
  },
  {
    code: "nmol/mL/h",
    label: "nanomole per millilitre per hour",
    description: "Rate of change in molarity"
  },
  {
    code: "nmol/mL/min",
    label: "nanomole per millilitre per minute",
    description: "Rate of change in molarity"
  },
  {
    code: "nmol/mg",
    label: "nanomole per milligram",
    description: "Concentration of a substance in a sample"
  },
  {
    code: "nmol/mg/h",
    label: "nanomole per milligram per hour",
    description: "Rate of change in concentration of a substance in a sample "
  },
  {
    code: "nmol/mg{creat}",
    label: "nanomole per milligram of creatinine",
    description:
      "Concentration of a substance in a sample normalized for the concentration of creatinine in the sample"
  },
  {
    code: "nmol/mg{prot}",
    label: "nanomole per milligram of protein",
    description:
      "Concentration of a substance in a sample normalized for the amount of protein in the sample"
  },
  {
    code: "nmol/mg{prot}/h",
    label: "nanomole per milligram of protein per hour",
    description:
      "Rate of change of a substance within a biological system, normalized by mass of protein and time"
  },
  {
    code: "nmol/min",
    label: "nanomole per minute",
    description: "Rate of change of a substance in a system "
  },
  {
    code: "nmol/min/10*6{cells}",
    label: "nanomole per minute per million cells",
    description: "Rate of change of a process normalized by the number of cells involved"
  },
  {
    code: "nmol/min/mL",
    label: "nanomole per minute per millilitre",
    description:
      "Rate of change of a process in a liquid solution over the course of one minute, normalized by the volume of the liquid"
  },
  {
    code: "nmol/min/mg{Hb}",
    label: "nanomole per minute per milligram of hemoglobin",
    description:
      "Rate of change of a process normailzed by the amount of hemoglobin in the sample"
  },
  {
    code: "nmol/min/mg{prot}",
    label: "nanomole per minute per milligram of protein",
    description:
      "Rate of change of a process normalized by the amount of protein in a biological sample"
  },
  {
    code: "nmol/mmol",
    label: "nanomole per millimole",
    description: "Ratio of quantities"
  },
  {
    code: "nmol/mmol{creat}",
    label: "nanomole per millimole of creatinine",
    description: "Concentration of a specific substance in urine"
  },
  {
    code: "nmol/mol",
    label: "nanomole per mole",
    description: "Represents very small ratio or proportion of two quantities"
  },
  {
    code: "nmol/nmol",
    label: "nanomole per nanomole",
    description: "Ratio of quantities"
  },
  {
    code: "nmol/s",
    label: "nanomole per second",
    description: "Rate of change of quantity"
  },
  {
    code: "nmol/s/L",
    label: "nanomole per second per litre",
    description: "Rate of change of quantity normalized by the volume of the system"
  },
  {
    code: "nmol/umol{creat}",
    label: "nanomole per micromole  of creatinine",
    description: "Ratio of one quantity to another quantity of creatinine"
  },
  {
    code: "nmol{ATP}",
    label: "nanomole of ATP",
    description: "One billionth of a mole of ATP"
  },
  {
    code: "nmol{BCE}",
    label: "nanomole bone collagen equivalent",
    description: "One billionth of a mole of bone collagen equivalent"
  },
  {
    code: "nmol{BCE}/L",
    label: "nanomole bone collagen equivalent per litre",
    description: "One billionth of a mole of bone collagen equivalent relative to volume"
  },
  { code: "ns", label: "nanosecond", description: "Unit of time" },
  {
    code: "osm",
    label: "osmole",
    description:
      "Quantifies the number of particles that contribute to the osmotic pressure in a solution"
  },
  {
    code: "osm/L",
    label: "osmole per litre",
    description: "Osmotically active particles in one litre of solution"
  },
  {
    code: "osm/kg",
    label: "osmole per kilogram",
    description: "Osmotically active particles in one kilogram of substance"
  },
  {
    code: "pA",
    label: "picoampere",
    description: "One trillionth of an ampere"
  },
  {
    code: "pL",
    label: "picolitre",
    description: "One trillionth of a litre"
  },
  {
    code: "pT",
    label: "picotesla",
    description: "One trillionth of a tesla"
  },
  {
    code: "pg/L",
    label: "picogram per litre",
    description: "Concentration of a substance in a liquid"
  },
  {
    code: "pg/dL",
    label: "picogram per decilitre",
    description: "Concentration of a substance in a liquid "
  },
  {
    code: "pg/mL",
    label: "picogram per millilitre",
    description: "Concentration of a substance in a liquid "
  },
  {
    code: "pg/mg",
    label: "picogram per milligram",
    description: "Concentration of a substance in a sample "
  },
  {
    code: "pg/mg{creat}",
    label: "picogram per milligram of creatinine",
    description:
      "Concentration of a substance in a sample normalized for the concentration of creatinine in the sample"
  },
  {
    code: "pg/mm",
    label: "picogram per millimetre",
    description: "Linear density"
  },
  {
    code: "pg/{RBC}",
    label: "picogram per red blood cell",
    description: "Concentration of a specific substance in each individual red blood cell"
  },
  {
    code: "pg/{cells}",
    label: "picogram per cell",
    description: "Mass of substance in each cell"
  },
  {
    code: "pkat",
    label: "picokatal",
    description: "Unit of measurement for catalytic activity"
  },
  { code: "pm", label: "picometre", description: "Unit of length" },
  {
    code: "pmol",
    label: "picomole",
    description: "Unit of concentration"
  },
  {
    code: "pmol/(24.h)",
    label: "picomole per 24 hour",
    description: "Rate of change in concentration of a substance "
  },
  {
    code: "pmol/L",
    label: "picomole per litre",
    description: "Molarity"
  },
  {
    code: "pmol/d",
    label: "picomole per day",
    description: "Rate of change of a substance in a system "
  },
  {
    code: "pmol/dL",
    label: "picomole per decilitre",
    description: "Molarity"
  },
  {
    code: "pmol/g",
    label: "picomole per gram",
    description:
      "Concentration of a substance in a sample relative to the mass of the sample"
  },
  {
    code: "pmol/h/mL",
    label: "picomole per hour per millilitre",
    description:
      "Rate of change of a substance in a liquid solution over the course of an hour"
  },
  {
    code: "pmol/h/mg{prot}",
    label: "picomole per hour per milligram of protein",
    description:
      "Rate of change of a process normailzed by the amount of protein in a sample"
  },
  {
    code: "pmol/mL",
    label: "picomole per millilitre",
    description: "Molarity"
  },
  {
    code: "pmol/mg{prot}",
    label: "picomole per milligram of protein",
    description: "Rate of change of a substance in a sample of protein"
  },
  {
    code: "pmol/min",
    label: "picomole per minute",
    description: "Rate of change of a substance in a system "
  },
  {
    code: "pmol/min/mg{prot}",
    label: "picomole per minute per milligram of protein",
    description:
      "Rate of change of a biochemical process typically an enzymatic reaction normalized by the amount of protein in a biological sample"
  },
  {
    code: "pmol/mmol{creat}",
    label: "picomole per millimole of creatinine",
    description:
      "Concentration of a specific substance in a biological sample normalized by the amount of creatinine in the sample"
  },
  {
    code: "pmol/umol",
    label: "picomole per micromole",
    description: "Ratio of concentrations"
  },
  {
    code: "pmol/umol{creat}",
    label: "picomole per micromole of creatinine",
    description: "Ratio of concentrations"
  },
  {
    code: "pmol/{RBC}",
    label: "picomole per red blood cell",
    description: "Concentration of substance within individual red blood cells"
  },
  { code: "ps", label: "picosecond", description: "Unit of time" },
  { code: "s", label: "second", description: "Unit of time" },
  {
    code: "s/{control}",
    label: "second per control",
    description: "Unit of time "
  },
  { code: "t", label: "metric ton", description: "Unit of mass" },
  {
    code: "uL/(2.h)",
    label: "microlitre per 2 hour",
    description: "Rate of fluid flow"
  },
  {
    code: "uL/h",
    label: "microlitre per hour",
    description: "Rate of fluid flow"
  },
  {
    code: "uOhm",
    label: "microOhm",
    description: "Unit of electrical resistance"
  },
  {
    code: "uU/L",
    label: "micro enzyme unit per litre",
    description: "Concentration of an enzyme in a solution "
  },
  {
    code: "uU/g",
    label: "micro enzyme unit per gram",
    description: "Concentration of an enzyme in a sample"
  },
  {
    code: "uU/mL",
    label: "micro enzyme unit per millilitre",
    description: "Concentration of an enzyme in a solution "
  },
  {
    code: "uV",
    label: "microvolt",
    description: "Unit of electrical potential difference"
  },
  {
    code: "u[iU]",
    label: "micro international unit",
    description: "Potency of biological substances"
  },
  {
    code: "u[iU]/L",
    label: "micro international unit per litre",
    description: "Concentration of biological sustance in a liquid"
  },
  {
    code: "u[iU]/mL",
    label: "micro international unit per millilitre",
    description: "Concentration of biological sustance in a liquid"
  },
  {
    code: "ueq",
    label: "microequivalent",
    description: "Quantity of an ion group in solution or chemical reaction"
  },
  {
    code: "ueq/L",
    label: "microequivalent per litre",
    description: "Quantity of an ion group in solution or chemical reaction"
  },
  {
    code: "ueq/mL",
    label: "microequivalent per millilitre",
    description: "Quantity of an ion group in solution or chemical reaction"
  },
  {
    code: "ug/(100.g)",
    label: "microgram per 100 gram",
    description: "Concentration of a substance in a sample"
  },
  {
    code: "ug/(24.h)",
    label: "microgram per 24 hour",
    description: "Rate of change of mass"
  },
  {
    code: "ug/(8.h)",
    label: "microgram per 8 hour",
    description: "Rate of change of mass"
  },
  {
    code: "ug/L",
    label: "microgram per litre",
    description: "Measure of density"
  },
  {
    code: "ug/L/(24.h)",
    label: "microgram per litre per 24 hour",
    description: "Rate of change of a substance in a liquid solution"
  },
  {
    code: "ug/L{RBCs}",
    label: "microgram per litre of red blood cells",
    description: "Mass of substance relative to one litre of red blood cells"
  },
  {
    code: "ug/[sft_i]",
    label: "microgram per square foot (international)",
    description: "Mass relative to area"
  },
  {
    code: "ug/d",
    label: "microgram per day",
    description: "Rate of change of mass"
  },
  {
    code: "ug/dL",
    label: "microgram per decilitre",
    description: "Measure of density"
  },
  {
    code: "ug/dL{RBCs}",
    label: "microgram per decilitre of red blood cells",
    description: "Mass of substance relative to volume of red blood cells"
  },
  {
    code: "ug/g",
    label: "microgram per gram",
    description: "Concentration of a substance in a sample "
  },
  {
    code: "ug/g{Hb}",
    label: "microgram per gram of hemoglobin",
    description:
      "Concentration of a substance in a sample relative to the mass of hemoglobin"
  },
  {
    code: "ug/g{creat}",
    label: "microgram per gram of creatinine",
    description:
      "Concentration of a substance in a sample relative to the amount of creatinine"
  },
  {
    code: "ug/g{dry_tissue}",
    label: "microgram per gram of dry tissue",
    description:
      "Concentration of a substance in a sample relative to the amount of dry tissue"
  },
  {
    code: "ug/g{dry_wt}",
    label: "microgram per gram of dry weight",
    description:
      "Concentration of a substance in a sample relative to the amount of dry weight"
  },
  {
    code: "ug/g{feces}",
    label: "microgram  per gram of feces",
    description: "Concentration of a substance in a sample relative to the mass of feces"
  },
  {
    code: "ug/g{hair}",
    label: "microgram per gram of hair",
    description: "Concentration of a substance in a sample relative to the mass of hair"
  },
  {
    code: "ug/g{tissue}",
    label: "microgram per gram of tissue",
    description: "Concentration of a substance in a sample relative to the mass of tissue"
  },
  {
    code: "ug/h",
    label: "microgram per hour",
    description: "Rate of change of mass"
  },
  {
    code: "ug/kg/(8.h)",
    label: "microgram per kilogram per 8 hour",
    description: "Rate of change of mass"
  },
  {
    code: "ug/kg/d",
    label: "microgram per kilogram per day",
    description: "Rate of change of mass"
  },
  {
    code: "ug/kg/h",
    label: "microgram per kilogram per hour",
    description: "Rate of change of mass"
  },
  {
    code: "ug/kg/min",
    label: "microgram per kilogram per minute",
    description: "Rate of change "
  },
  {
    code: "ug/m3",
    label: "microgram per cubic metre",
    description: "Concentration of a substance in the air"
  },
  {
    code: "ug/mL",
    label: "microgram per millilitre",
    description: "Concentration of a substance in a liquid solution"
  },
  {
    code: "ug/mL{class}",
    label: "microgram per millilitre class",
    description: NaN
  },
  {
    code: "ug/mL{eqv}",
    label: "microgram per millilitre equivalent",
    description: NaN
  },
  {
    code: "ug/mg",
    label: "microgram per milligram",
    description: "Ratio of masses"
  },
  {
    code: "ug/mg{creat}",
    label: "microgram per milligram of creatinine",
    description: "Ratio of mass relative to the mass of creatinine within the sample"
  },
  {
    code: "ug/min",
    label: "microgram per minute",
    description: "Rate of change of mass"
  },
  {
    code: "ug/mmol",
    label: "microgram per millimole",
    description: "Molar mass"
  },
  {
    code: "ug/mmol{creat}",
    label: "microgram per millimole of creatinine",
    description: "Ratio of mass to mircomoles of creatinine"
  },
  {
    code: "ug/ng",
    label: "microgram per nanogram",
    description: "Ratio of masses"
  },
  {
    code: "ug/{specimen}",
    label: "microgram per specimen",
    description: "Mass of a substance per specimen"
  },
  {
    code: "ug{FEU}/mL",
    label: "microgram fibrinogen equivalent unit per millilitre",
    description: "Fibrinogen concentrations in the blood"
  },
  {
    code: "ukat",
    label: "microkatal",
    description: "Unit of enzymatic activity"
  },
  { code: "um", label: "micrometre", description: "Unit of length" },
  { code: "um/s", label: "microns per second", description: "Speed" },
  {
    code: "umol/(2.h)",
    label: "micromole per 2 hour",
    description: "Rate of change of micromoles"
  },
  {
    code: "umol/(24.h)",
    label: "micromole per 24 hour",
    description: "Rate of change of micromoles"
  },
  {
    code: "umol/(8.h)",
    label: "micromole per 8 hour",
    description: "Rate of change of micromoles"
  },
  {
    code: "umol/L",
    label: "micromole per litre",
    description: "Molarity"
  },
  {
    code: "umol/L/h",
    label: "micromole per litre per hour",
    description: "Rate of change of molarity"
  },
  {
    code: "umol/L{RBCs}",
    label: "micromole per litre of red blood cells",
    description:
      "Concentration of a substance relative to the amount of red blood cells in the sample"
  },
  {
    code: "umol/d",
    label: "micromole per day",
    description: "Rate of change of micromoles"
  },
  {
    code: "umol/dL",
    label: "micromole per decilitre",
    description: "Molarity"
  },
  {
    code: "umol/dL{GF}",
    label: "micromole per decilitre of glomerular filtrate",
    description: "Concentration of a specific substance in the glomerular filtrate"
  },
  {
    code: "umol/g",
    label: "micromole per gram",
    description: "Moles relative to the mass of the sample"
  },
  {
    code: "umol/g{Hb}",
    label: "micromole per gram of hemoglobin",
    description:
      "Concentration of moles relative to the amount of hemoglobin in the sample"
  },
  {
    code: "umol/g{creat}",
    label: "micromole per gram of creatinine",
    description: "Concentration of a substance in urine"
  },
  {
    code: "umol/h",
    label: "micromole per hour",
    description: "Rate of change in the concentration of a substance "
  },
  {
    code: "umol/kg",
    label: "micromole per kilogram",
    description: "Concentration of moles relative to the mass of the sample"
  },
  {
    code: "umol/kg{feces}",
    label: "micromole per kilogram of feces",
    description: "Concentration of moles relative to the mass of the fecal sample"
  },
  {
    code: "umol/mL",
    label: "micromole per millilitre",
    description: "Molarity"
  },
  {
    code: "umol/mL/min",
    label: "micromole per millilitre per minute",
    description: "Rate of change of molarity"
  },
  {
    code: "umol/mg",
    label: "micromole per milligram",
    description: "Ratio of two different mass quantities"
  },
  {
    code: "umol/mg{creat}",
    label: "micromole per milligram of creatinine",
    description:
      "Concentration of a substance in urine while normalizing for variations in urine dilution based on creatinine levels"
  },
  {
    code: "umol/min",
    label: "micromole per minute",
    description: "Rate of change of micromoles"
  },
  {
    code: "umol/min/L",
    label: "micromole per minute per litre",
    description: "Rate of change of micromoles relative to volume"
  },
  {
    code: "umol/min/g",
    label: "micromole per minute per gram",
    description: "Rate of change of micromoles relative to mass"
  },
  {
    code: "umol/min/g{mucosa}",
    label: "micromole per minute per gram of mucosa",
    description:
      "Rate of a metabolic or enzymatic process involving a substance in a specific type of tissue, often mucosal tissue"
  },
  {
    code: "umol/min/g{prot}",
    label: "micromole per minute per gram of protein",
    description:
      "Express the rate of a metabolic or enzymatic process normalized by the amount of protein in a tissue or solution"
  },
  {
    code: "umol/mmol",
    label: "micromole per millimole",
    description:
      "Relationship between two quantities of a substance interms of molar ratios"
  },
  {
    code: "umol/mmol{creat}",
    label: "micromole per millimole of creatinine",
    description:
      "Concentration of a specific substance in urine normalized by dilution based on creatine levels"
  },
  {
    code: "umol/mol",
    label: "micromole per mole",
    description:
      "Relationship between two quantities of a substance interms of molar ratios"
  },
  {
    code: "umol/mol{Hb}",
    label: "micromole per mole of hemoglobin",
    description: "Ratio of a substance to hemoglobin based on molar ratios"
  },
  {
    code: "umol/mol{creat}",
    label: "micromole per mole of creatinine",
    description: "Ratio of a substance to hemoglobin based on molar ratios"
  },
  {
    code: "umol/umol",
    label: "micromole per micromole",
    description: "Molar ratios of two substances"
  },
  {
    code: "umol/umol{creat}",
    label: "micromole per micromole of creatinine",
    description: "Molar ratio of a substance and creatinine in the sample"
  },
  {
    code: "umol{BCE}/mol",
    label: "micromole bone collagen equivalent per mole",
    description: "Molar ratio of bone collagen and a substance"
  },
  { code: "us", label: "microsecond", description: "Unit of time" },
  { code: "wk", label: "week", description: "Unit of time" },
  { code: "{#}", label: "number", description: "Numeric unit" },
  {
    code: "{#}/L",
    label: "number per litre",
    description: "Numeric unit relative to volume"
  },
  {
    code: "{#}/[HPF]",
    label: "number per high power field",
    description:
      "Count of specific objects in a sample observed under a microscope at high magnification"
  },
  {
    code: "{#}/[LPF]",
    label: "number per low power field",
    description:
      "Count of specific objects in a sample observed under a microscope at low magnification"
  },
  {
    code: "{#}/mL",
    label: "number per millilitre",
    description: "Count of specific objects in a sample in a liquid"
  },
  {
    code: "{#}/min",
    label: "number per minute",
    description: "Rate of change  of specific objects in a sample "
  },
  {
    code: "{#}/uL",
    label: "number per microlitre",
    description: "Count of specific objects relative to one microlitre"
  },
  {
    code: "{#}/{platelet}",
    label: "molecule per platelet",
    description: "Concentration of specific molecules or substances within platelets"
  },
  {
    code: "{AHF'U}",
    label: "American Hospital Formulary unit",
    description: "Used for the standardization of reporting the strength of a medication"
  },
  {
    code: "{APS'U}",
    label: "IgA antiphosphatidylserine unit",
    description:
      "Unit in the context of laboratory testing for antiphospholipid antibodies"
  },
  {
    code: "{ARU}",
    label: "aspirin response unit",
    description:
      "Measures how well aspirin affects the platelet activity in a patient's blood"
  },
  {
    code: "{CAE'U}",
    label: "complement activity enzyme unit",
    description: "Quantifies the enzymatic activity of complement proteins"
  },
  {
    code: "{CAG_repeats}",
    label: "CAG trinucleotide repeats",
    description: "Type of repetitive DNA sequence "
  },
  {
    code: "{CH100'U}",
    label: "complement CH100 unit",
    description:
      "Historical unit of measurement used to quantify the hemolytic activity of the complement system in the blood"
  },
  {
    code: "{CPM}",
    label: "counts per minute",
    description: "Count of specific object relative to one minute"
  },
  {
    code: "{CPM}/10*3{cells}",
    label: "counts per minute per thousand cells",
    description:
      "Count of specific object relative to one minute relative to 1 thousand cells"
  },
  {
    code: "{EIA'U}",
    label: "EIA unit",
    description:
      "Concentration of substances such as antigens, or antibodies in a given sample"
  },
  {
    code: "{EIA'U}/U",
    label: "EIA unit per enzyme unit",
    description:
      "Concentration of substances such as antigens, or antibodies in a given sample relative to the activity of enzymes"
  },
  {
    code: "{EIA_index}",
    label: "EIA index",
    description:
      "Quantifies the results of immunoassays, particularly when measuring antibodies"
  },
  {
    code: "{EIA_titer}",
    label: "EIA titer",
    description: "Concentration of antibodies in a patients blood"
  },
  {
    code: "{ELISA'U}",
    label: "ELISA unit",
    description: "Detects specific proteins, or antibodies in biological samples"
  },
  {
    code: "{EV}",
    label: "EIA value",
    description: "Numerical result obtained from an Enzyme Immunoassay"
  },
  {
    code: "[ELU]",
    label: "ELISA unit",
    description:
      "Quantifies the concentration of a specific analyte in a biological sample"
  },
  {
    code: "{Ehrlich'U}",
    label: "Ehrlich unit",
    description: "Concentration of a particular substance in a sample"
  },
  {
    code: "[EU]",
    label: "Ehrlich unit",
    description: "Concentration of a particular substance in a sample"
  },
  {
    code: "{Ehrlich'U}/(2.h)",
    label: "Ehrlich unit per 2 hour",
    description:
      "Rate of change of the concentration of a particular substance over a two hour period"
  },
  {
    code: "{Ehrlich'U}/100.g",
    label: "Ehrlich unit per 100 gram",
    description: "Concentration of a particular substance in a sample relative to mass"
  },
  {
    code: "{Ehrlich'U}/d",
    label: "Ehrlich unit per day",
    description:
      "Rate of change of the concentration of a particular substance over a one day period"
  },
  {
    code: "{Ehrlich'U}/dL",
    label: "Ehrlich unit per decilitre",
    description: "Enzyme activity per deciliter of a solution"
  },
  {
    code: "{FIU}",
    label: "fluorescent intensity unit",
    description: "Fluorescent intensity in a fluorescence-based experiment"
  },
  {
    code: "[FFU]",
    label: "focus forming units",
    description: "Quantifies the infectious titer of a virus "
  },
  {
    code: "{GAA_repeats}",
    label: "GAA trinucleotide repeats",
    description: "Type of repetitive DNA sequence "
  },
  {
    code: "{GPS'U}",
    label: "IgG antiphosphatidylserine unit",
    description: "Measures the amount of IgG antibodies in a sample"
  },
  {
    code: "{Globules}/[HPF]",
    label: "globules (drops)  per high power field",
    description: "Quantifies the amount of drops in a sample under high power microscope"
  },
  {
    code: "{HA_titer}",
    label: "influenza hemagglutination titer",
    description:
      "Measure the ability of the influenza viruses to agglutinate red blood cells"
  },
  {
    code: "{IFA_index}",
    label: "immunofluorescence assay index",
    description:
      "Laboratory technique used to detect and quantify specific antibodies or antigens in a biological sample"
  },
  {
    code: "{IFA_titer}",
    label: "Immunofluorescence assay titer",
    description:
      "Represents the highest dilution of a patient's serum that still produces a specific fluorescent signal in an experiment"
  },
  {
    code: "{INR}",
    label: "international normalized ratio",
    description:
      "A standardized measurement used to evaluate the clotting tendency of a patient's blood and to monitor the effects of anticoagulant medications"
  },
  {
    code: "{ISR}",
    label: "immune status ratio",
    description: "Assesses immune status "
  },
  {
    code: "{ImmuneComplex'U}",
    label: "immune complex unit",
    description: "Quantifies the amount of immune complexes in a biological sample"
  },
  {
    code: "{KCT'U}",
    label: "kaolin clotting time",
    description:
      "Assesses the intrinsic coagulation pathway of the blood clotting process"
  },
  {
    code: "{KRONU'U}/mL",
    label: "Kronus unit per millilitre",
    description: "Used in the context of laboratory tests or immunoassays"
  },
  {
    code: "{Log_IU}",
    label: "log (base 10) international unit",
    description:
      "Refers to logarithimic scale used to express the international unit on a base 10 scale"
  },
  {
    code: "{Log_IU}/mL",
    label: "log (base 10) international unit per millilitre",
    description:
      "Refers to logarithimic scale used to express measurement on a base 10 scale relative to volume"
  },
  {
    code: "{Log_copies}/mL",
    label: "log (base 10) copies per millilitre",
    description:
      "Refers to logarithimic scale used to express measurement on a base 10 scale relative to volume"
  },
  {
    code: "{Log}",
    label: "log (base 10)",
    description:
      "Refers to logarithimic scale used to express measurement on a base 10 scale"
  },
  {
    code: "{Lyme_index_value}",
    label: "Lyme index value",
    description: "Quantifies Lyme disease"
  },
  {
    code: "{M.o.M}",
    label: "multiple of the median",
    description:
      "A statistical concept often used in medical screening and diagnostic tests "
  },
  {
    code: "{MPS'U}",
    label: "IgM antiphosphatidylserine unit",
    description: "Measurement used for antiphospholipid antibodies "
  },
  {
    code: "{MPS'U}/mL",
    label: "IgM antiphosphatidylserine unit per millilitre",
    description: "Measurement used for antiphospholipid antibodies relative to volume"
  },
  {
    code: "{OD_unit}",
    label: "optical density unit",
    description:
      "Unit used in spectrophotometry to quantify the optical density or absorbance of light by a sample"
  },
  {
    code: "{RBC}/uL",
    label: "red blood cell per microlitre",
    description: "Count of red blood cells per unit of volume "
  },
  {
    code: "{Rubella_virus}",
    label: "rubella virus",
    description: "Type of virus"
  },
  {
    code: "{STDV}",
    label: "standard deviation",
    description:
      "Statistical measure of the amount of variation or dispersion in a set of data points "
  },
  {
    code: "[S]",
    label: "Svedberg unit",
    description: "Measure the rate at which particles sediment in a centrifugal field "
  },
  {
    code: "{TSI_index}",
    label: "thyroid-stimulating immunoglobulin index",
    description:
      "Laboratory test used in the diagnosis and monitoring of autoimmune thyroid diseases"
  },
  {
    code: "{WBCs}",
    label: "white blood cells",
    description: "Type of cell"
  },
  {
    code: "{absorbance}",
    label: "absorbance",
    description:
      "Quantifies the amount of light that a substance absorbs at a specific wavelength"
  },
  {
    code: "{activity}",
    label: "activity",
    description: "Describes the expenditure of energy of some organism"
  },
  {
    code: "[Amb'a'1'U]",
    label: "allergen unit for Ambrosia artemisiifolia",
    description: "Allergen unit"
  },
  {
    code: "{asnecessary}",
    label: "as necessary",
    description: "Indicates that something shold be done only when it is needed"
  },
  {
    code: "{beats}/min",
    label: "heart beats per minute",
    description:
      "Quantifies the amount of types a heart will contract and relax in one minute"
  },
  {
    code: "{binding_index}",
    label: "binding index",
    description:
      "Numerical value that quantifies affinity of binding between two molecules"
  },
  {
    code: "[BAU]",
    label: "bioequivalent allergen unit",
    description: "Allergen unit"
  },
  {
    code: "{cells}",
    label: "cells",
    description: "Basic structural and functional units of all living organisms"
  },
  {
    code: "{cells}/[HPF]",
    label: "cells per high power field",
    description:
      "Basic structural and functional units of all living organisms under a high power microscope"
  },
  {
    code: "{cells}/uL",
    label: "cells per microlitre",
    description:
      "Basic structural and functional units of all living organisms relative to volume"
  },
  {
    code: "{clock_time}",
    label: "clock time e.g 12:30PM",
    description: "Measure of time"
  },
  {
    code: "{copies}",
    label: "copies",
    description: "Reproductions of an original item"
  },
  {
    code: "{copies}/mL",
    label: "copies per millilitre",
    description: "Reproductions of an original item relative to volume"
  },
  {
    code: "{copies}/ug",
    label: "copies per microgram",
    description: "Reproductions of an original item relative to mass"
  },
  {
    code: "{count}",
    label: "count",
    description: "Determines the number of items"
  },
  {
    code: "{cyclical}",
    label: "cyclical",
    description: "A system occurs in an organized and repetative fashion"
  },
  {
    code: "[D'ag'U]",
    label: "D-antigen unit",
    description: "Quantifies the concentration of the D-antigen "
  },
  { code: "10.a", label: "decade", description: "Unit of time" },
  {
    code: "{delta_OD}",
    label: "change in (delta) optical density",
    description: "Difference in optical density at two different points"
  },
  {
    code: "{dilution}",
    label: "dilution",
    description: "Decrease in concentration of a substance"
  },
  {
    code: "{fraction}",
    label: "fraction",
    description: "Portion of a whole"
  },
  {
    code: "{genomes}/mL",
    label: "genomes per millilitre",
    description: "Concentration of genetic material in a liquid sample"
  },
  {
    code: "{index_val}",
    label: "index value",
    description: "Represents a numerical measurement or score"
  },
  {
    code: "{minidrop}/min",
    label: "minidrop per minute",
    description:
      "Used in the medical field to quantify administration of intravenous fluids"
  },
  {
    code: "{minidrop}/s",
    label: "minidrop per second",
    description:
      "Used in the medical field to quantify administration of intravenous fluids"
  },
  {
    code: "{mm/dd/yyyy}",
    label: "month-day-year",
    description: "An order to record a date in time"
  },
  {
    code: "{mutation}",
    label: "mutation",
    description: "A genetic phenomenon"
  },
  {
    code: "{percentile}",
    label: "percentile",
    description:
      "Statistical measure used to indicate the relaive rank of a particular value within a dataset"
  },
  {
    code: "{phenotype}",
    label: "phenotype",
    description: "Observable physical and functional characteristics of an organism"
  },
  {
    code: "{ratio}",
    label: "ratio",
    description: "Comparison of two quantities"
  },
  {
    code: "{rel_saturation}",
    label: "relative saturation",
    description:
      "Typically refers to the degree to which a substance is present in a mixture compared to is maximum possible concentration at a given condition"
  },
  {
    code: "{s_co_ratio}",
    label: "signal to cutoff ratio",
    description: "Numerical value used in diagnostic testing"
  },
  {
    code: "{saturation}",
    label: "saturation",
    description: "Describes the state of being at maximum capacity"
  },
  {
    code: "[smgy'U]",
    label: "Somogyi unit",
    description: "Assesses the activity of an enzyme called amylase"
  },
  {
    code: "{shift}",
    label: "shift",
    description: "Vefers to change or adjustment"
  },
  {
    code: "{spermatozoa}/mL",
    label: "spermatozoa per millilitre",
    description: "Concentration of sperm in a liquid sample relative to volume"
  },
  {
    code: "{titer}",
    label: "titer",
    description: "Concentration or potency of a substance in a biological sample"
  },
  {
    code: "{total}",
    label: "total",
    description: "Describes the sum of something"
  },
  {
    code: "{trimester}",
    label: "trimester",
    description: "Unit of time"
  },
  {
    code: "M[iU]/L",
    label: "mega-international unit per litre",
    description:
      "Used to express the concentration of a substance or activity level in a liquid sample"
  },
  {
    code: "M[iU]/mL",
    label: "mega-international unit per millilitre",
    description:
      "Used to express the concentration of a substance or activity level in a liquid sample"
  },
  {
    code: "[arb'U]/L",
    label: "arbitrary unit per litre",
    description: "Measurement relative to volume"
  },
  {
    code: "cm3",
    label: "cubic centimetre",
    description: "Unit of volume"
  },
  {
    code: "g/cm2",
    label: "grams per square centimetre",
    description: "Mass relative to area"
  },
  {
    code: "g/uL",
    label: "grams per microlitre",
    description: "Mass relative to volume"
  },
  {
    code: "mL/kg/(12.h)",
    label: "millilitres per kilogram per 12 hour",
    description:
      "Measurement used in medical contexts to express the rate at which a medication is administered to a patient over a 12 hour period"
  },
  {
    code: "mL/min/L",
    label: "millilitre per minute per litre",
    description: "Rate of fluid volume passing through a unit volume of medium per minute"
  },
  {
    code: "mL/mm3",
    label: "mililitre per cubic millimetre",
    description: "Unit of measurement used to express volume density"
  },
  {
    code: "mg/min/{1.73_m2}",
    label: "milligram per minute per 1.73 square metre",
    description:
      "Used in the context of medical measurements to express the rate of substance clearance "
  },
  {
    code: "mg/uL",
    label: "milligram per microlitre",
    description:
      "Unit of measurement used to express the concentration or density of a substance in a liquid"
  },
  {
    code: "mm/(2.h)",
    label: "millimetre per 2 hour",
    description: "Rate of change in distance over time"
  },
  {
    code: "mm/L",
    label: "millimetre per litre",
    description: "Density of a substance in a liquid"
  },
  {
    code: "mm3",
    label: "cubic millimetre",
    description: "Unit of volume"
  },
  {
    code: "mmol/mL",
    label: "millimole per millilitre",
    description: "Molarity"
  },
  {
    code: "ng/nL",
    label: "nanogram per nanolitre",
    description: "Density of a substance in a liquid"
  },
  {
    code: "nkat/L",
    label: "nanokatal per litre",
    description: "Concentration or activity of an enzyme in a liquid"
  },
  {
    code: "ukat/L",
    label: "microkatal per litre",
    description: "Concentration or activity of an enzyme in a liquid"
  },
  {
    code: "um3",
    label: "cubic micrometre",
    description: "Unit of volume"
  },
  {
    code: "umol/s",
    label: "micromole per second",
    description: "Rate of change in quantity of moles "
  },
  {
    code: "{cells}/L",
    label: "cells per litre",
    description: "Quantity of cells relative to volume"
  },
  {
    code: "{cells}/cm3",
    label: "cells per cubic centimetre",
    description: "Quantity of cells relative to volume"
  },
  {
    code: "{cells}/mL",
    label: "cells per millilitre",
    description: "Quantity of cells relative to volume"
  },
  {
    code: "{cells}/mm",
    label: "cells per millimetre",
    description: "Quantity of cells relative to volume"
  },
  {
    code: "{cells}/mm3",
    label: "cells per cubic millimetre",
    description: "Quantity of cells relative to volume"
  },
  {
    code: "10*3/mm3",
    label: "thousand per cubic millimetre",
    description: "One thousand of a specific object relative to volume"
  },
  {
    code: "10*2/uL",
    label: "hundred per microlitre",
    description: "One hundred of a specific object relative to volume"
  },
  {
    code: "10*4/mm3",
    label: "10 thousand per cubic millimetre",
    description: "Ten thousand of a specific object relative to volume"
  },
  {
    code: "ug/uL",
    label: "microgram per microlitre",
    description: "Density of a substance in a liquid"
  },
  {
    code: "uL/mL",
    label: "microlitre per millilitre",
    description: "Ratio of volumes"
  },
  {
    code: "/(250.mL)",
    label: "per 250 millilitre",
    description: "Comparison to volume"
  },
  {
    code: "/mm3",
    label: "per cubic millimetre",
    description: "Comparison to volume"
  },
  {
    code: "/nL",
    label: "per nanolitre",
    description: "Comparison to volume"
  },
  {
    code: "/pL",
    label: "per picolitre",
    description: "Comparison to volume"
  },
  {
    code: "[beth'U]/mL",
    label: "Bethesda unit per millilitre",
    description:
      "Used in the field of clinical immunology to express the concentration of specific antibodies in a given volume"
  },
  {
    code: "{breaths}",
    label: "breaths",
    description: "Act of inhaling and exhaling air"
  },
  {
    code: "{breaths}/min",
    label: "breaths per minute",
    description: "Rate in inhaling and exhaling air"
  },
  {
    code: "{cells}/nL",
    label: "cells per nanolitre",
    description: "Used to express the concentration or density of cells"
  },
  {
    code: "{vol}/{vol}",
    label: "volume per volume",
    description: "Ratio of volumes"
  },
  {
    code: "10*12/mm3",
    label: "trillion per cubic millimetre",
    description: "One trillion of an object relative to volume"
  },
  {
    code: "10*12/uL",
    label: "trillion per cubic microlitre",
    description: "Density of a substance in a given volume"
  },
  { code: "10*2", label: "hundred", description: "Numeric value" },
  {
    code: "10*3/(250.mL)",
    label: "thousand per 250 millilitre",
    description: "Concentration unit "
  },
  {
    code: "10*3/mol",
    label: "thousand per mole",
    description: "Numeric value relative to one mole"
  },
  { code: "10*4", label: "10 thousand", description: "Numeric value" },
  {
    code: "10*4/(250.mL)",
    label: "10 thousand per 250 millilitre",
    description: "Numeric value relative to volume"
  },
  {
    code: "10*4/L",
    label: "10 thousand per litre",
    description: "Numeric value relative to volume"
  },
  {
    code: "10*4{cells}/uL",
    label: "10 thousand cells per microlitre",
    description: "Numeric value of cells relative to volume"
  },
  {
    code: "10*6/mm3",
    label: "million per cubic millimetre",
    description: "Numeric value relative to volume"
  },
  {
    code: "10*6/mol/L",
    label: "million per mole per litre",
    description: "Numeric value relative to volume and one mole"
  },
  { code: "10*9", label: "billion", description: "Numeric unit" },
  {
    code: "10*9/mm3",
    label: "billion per cubic millimetre",
    description: "Numeric value relative to volume"
  },
  {
    code: "g/(100.mL)",
    label: "gram per 100 millilitre",
    description: "Density of a substance in a given volume"
  },
  {
    code: "m[iU]",
    label: "milli-international unit",
    description: "Concentration or activity of certain substances in the blood"
  },
  { code: "m3", label: "cubic metre", description: "Unit of volume" },
  {
    code: "mg/(100.mL)",
    label: "milligram per 100 millilitre",
    description: "Density of a substance in a given volume"
  },
  {
    code: "U/mm3",
    label: "enzyme unit per cubic millimetre",
    description: "Measure of enzymes relative to volume"
  },
  {
    code: "umol/L/s",
    label: "micromole per litre per second",
    description: "Rate of change of a substance in a liquid over time"
  }
];

export default ucumUnits;

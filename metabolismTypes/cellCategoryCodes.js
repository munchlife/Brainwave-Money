'use strict';

// cellCategoryCodes.js

// SOURCE: https://en.wikipedia.org/wiki/Electrogram

// cccNumber   = CCC
// description = Cell Category
// reportable  = Reportable under 6041/6041A and Authority for Exception

var CellCategoryCodes = module.exports = [
 { cccNumber: 0742, cccMin: null, cccMax: null, abbr: 'XXXXXX', description: 'Heart',                                                          reportable: true  },
 { cccNumber: 0763, cccMin: null, cccMax: null, abbr: 'XXXXXX', description: 'Stomach',                                                        reportable: true  },
 { cccNumber: 0780, cccMin: null, cccMax: null, abbr: 'XXXXXX', description: 'Brain',                                                          reportable: true  },
 { cccNumber: 1520, cccMin: null, cccMax: null, abbr: 'XXXXXX', description: 'Muscle',                                                         reportable: true  },
 { cccNumber: 1711, cccMin: null, cccMax: null, abbr: 'XXXXXX', description: 'Skin',                                                           reportable: true  },
];

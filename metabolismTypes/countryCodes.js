'use strict';

// countryCodes.js

// SOURCE: http://en.wikipedia.org/wiki/ISO_3166-1_alpha-3

var CountryCodes = module.exports = {};

CountryCodes.ENUM = {
    USA: { abbr: 'USA', fullName: 'United States of America' },

    // ABW: { abbr: 'ABW', fullName: 'Aruba' },
    // AFG: { abbr: 'AFG', fullName: 'Afghanistan' },
    // AGO: { abbr: 'AGO', fullName: 'Angola' },
    // AIA: { abbr: 'AIA', fullName: 'Anguilla' },
    // ALA: { abbr: 'ALA', fullName: 'Åland Islands' },
    // ALB: { abbr: 'ALB', fullName: 'Albania' },
    // AND: { abbr: 'AND', fullName: 'Andorra' },
    // ARE: { abbr: 'ARE', fullName: 'United Arab Emirates' },
    // ARG: { abbr: 'ARG', fullName: 'Argentina' },
    // ARM: { abbr: 'ARM', fullName: 'Armenia' },
    // ASM: { abbr: 'ASM', fullName: 'American Samoa' },
    // ATA: { abbr: 'ATA', fullName: 'Antarctica' },
    // ATF: { abbr: 'ATF', fullName: 'French Southern Territories' },
    // ATG: { abbr: 'ATG', fullName: 'Antigua and Barbuda' },
    // AUS: { abbr: 'AUS', fullName: 'Australia' },
    // AUT: { abbr: 'AUT', fullName: 'Austria' },
    // AZE: { abbr: 'AZE', fullName: 'Azerbaijan' },
    // BDI: { abbr: 'BDI', fullName: 'Burundi' },
    // BEL: { abbr: 'BEL', fullName: 'Belgium' },
    // BEN: { abbr: 'BEN', fullName: 'Benin' },
    // BES: { abbr: 'BES', fullName: 'Bonaire, Sint Eustatius and Saba' },
    // BFA: { abbr: 'BFA', fullName: 'Burkina Faso' },
    // BGD: { abbr: 'BGD', fullName: 'Bangladesh' },
    // BGR: { abbr: 'BGR', fullName: 'Bulgaria' },
    // BHR: { abbr: 'BHR', fullName: 'Bahrain' },
    // BHS: { abbr: 'BHS', fullName: 'Bahamas' },
    // BIH: { abbr: 'BIH', fullName: 'Bosnia and Herzegovina' },
    // BLM: { abbr: 'BLM', fullName: 'Saint Barthélemy' },
    // BLR: { abbr: 'BLR', fullName: 'Belarus' },
    // BLZ: { abbr: 'BLZ', fullName: 'Belize' },
    // BMU: { abbr: 'BMU', fullName: 'Bermuda' },
    // BOL: { abbr: 'BOL', fullName: 'Bolivia, Plurinational State of' },
    // BRA: { abbr: 'BRA', fullName: 'Brazil' },
    // BRB: { abbr: 'BRB', fullName: 'Barbados' },
    // BRN: { abbr: 'BRN', fullName: 'Brunei Darussalam' },
    // BTN: { abbr: 'BTN', fullName: 'Bhutan' },
    // BVT: { abbr: 'BVT', fullName: 'Bouvet Island' },
    // BWA: { abbr: 'BWA', fullName: 'Botswana' },
    // CAF: { abbr: 'CAF', fullName: 'Central African Republic' },
    // CAN: { abbr: 'CAN', fullName: 'Canada' },
    // CCK: { abbr: 'CCK', fullName: 'Cocos (Keeling) Islands' },
    // CHE: { abbr: 'CHE', fullName: 'Switzerland' },
    // CHL: { abbr: 'CHL', fullName: 'Chile' },
    // CHN: { abbr: 'CHN', fullName: 'China' },
    // CIV: { abbr: 'CIV', fullName: 'Côte d\'Ivoire' },
    // CMR: { abbr: 'CMR', fullName: 'Cameroon' },
    // COD: { abbr: 'COD', fullName: 'Congo, the Democratic Republic of the' },
    // COG: { abbr: 'COG', fullName: 'Congo' },
    // COK: { abbr: 'COK', fullName: 'Cook Islands' },
    // COL: { abbr: 'COL', fullName: 'Colombia' },
    // COM: { abbr: 'COM', fullName: 'Comoros' },
    // CPV: { abbr: 'CPV', fullName: 'Cabo Verde' },
    // CRI: { abbr: 'CRI', fullName: 'Costa Rica' },
    // CUB: { abbr: 'CUB', fullName: 'Cuba' },
    // CUW: { abbr: 'CUW', fullName: 'Curaçao' },
    // CXR: { abbr: 'CXR', fullName: 'Christmas Island' },
    // CYM: { abbr: 'CYM', fullName: 'Cayman Islands' },
    // CYP: { abbr: 'CYP', fullName: 'Cyprus' },
    // CZE: { abbr: 'CZE', fullName: 'Czech Republic' },
    // DEU: { abbr: 'DEU', fullName: 'Germany' },
    // DJI: { abbr: 'DJI', fullName: 'Djibouti' },
    // DMA: { abbr: 'DMA', fullName: 'Dominica' },
    // DNK: { abbr: 'DNK', fullName: 'Denmark' },
    // DOM: { abbr: 'DOM', fullName: 'Dominican Republic' },
    // DZA: { abbr: 'DZA', fullName: 'Algeria' },
    // ECU: { abbr: 'ECU', fullName: 'Ecuador' },
    // EGY: { abbr: 'EGY', fullName: 'Egypt' },
    // ERI: { abbr: 'ERI', fullName: 'Eritrea' },
    // ESH: { abbr: 'ESH', fullName: 'Western Sahara' },
    // ESP: { abbr: 'ESP', fullName: 'Spain' },
    // EST: { abbr: 'EST', fullName: 'Estonia' },
    // ETH: { abbr: 'ETH', fullName: 'Ethiopia' },
    // FIN: { abbr: 'FIN', fullName: 'Finland' },
    // FJI: { abbr: 'FJI', fullName: 'Fiji' },
    // FLK: { abbr: 'FLK', fullName: 'Falkland Islands (Malvinas)' },
    // FRA: { abbr: 'FRA', fullName: 'France' },
    // FRO: { abbr: 'FRO', fullName: 'Faroe Islands' },
    // FSM: { abbr: 'FSM', fullName: 'Micronesia, Federated States of' },
    // GAB: { abbr: 'GAB', fullName: 'Gabon' },
    // GBR: { abbr: 'GBR', fullName: 'United Kingdom' },
    // GEO: { abbr: 'GEO', fullName: 'Georgia' },
    // GGY: { abbr: 'GGY', fullName: 'Guernsey' },
    // GHA: { abbr: 'GHA', fullName: 'Ghana' },
    // GIB: { abbr: 'GIB', fullName: 'Gibraltar' },
    // GIN: { abbr: 'GIN', fullName: 'Guinea' },
    // GLP: { abbr: 'GLP', fullName: 'Guadeloupe' },
    // GMB: { abbr: 'GMB', fullName: 'Gambia' },
    // GNB: { abbr: 'GNB', fullName: 'Guinea-Bissau' },
    // GNQ: { abbr: 'GNQ', fullName: 'Equatorial Guinea' },
    // GRC: { abbr: 'GRC', fullName: 'Greece' },
    // GRD: { abbr: 'GRD', fullName: 'Grenada' },
    // GRL: { abbr: 'GRL', fullName: 'Greenland' },
    // GTM: { abbr: 'GTM', fullName: 'Guatemala' },
    // GUF: { abbr: 'GUF', fullName: 'French Guiana' },
    // GUM: { abbr: 'GUM', fullName: 'Guam' },
    // GUY: { abbr: 'GUY', fullName: 'Guyana' },
    // HKG: { abbr: 'HKG', fullName: 'Hong Kong' },
    // HMD: { abbr: 'HMD', fullName: 'Heard Island and McDonald Islands' },
    // HND: { abbr: 'HND', fullName: 'Honduras' },
    // HRV: { abbr: 'HRV', fullName: 'Croatia' },
    // HTI: { abbr: 'HTI', fullName: 'Haiti' },
    // HUN: { abbr: 'HUN', fullName: 'Hungary' },
    // IDN: { abbr: 'IDN', fullName: 'Indonesia' },
    // IMN: { abbr: 'IMN', fullName: 'Isle of Man' },
    // IND: { abbr: 'IND', fullName: 'India' },
    // IOT: { abbr: 'IOT', fullName: 'British Indian Ocean Territory' },
    // IRL: { abbr: 'IRL', fullName: 'Ireland' },
    // IRN: { abbr: 'IRN', fullName: 'Iran, Islamic Republic of' },
    // IRQ: { abbr: 'IRQ', fullName: 'Iraq' },
    // ISL: { abbr: 'ISL', fullName: 'Iceland' },
    // ISR: { abbr: 'ISR', fullName: 'Israel' },
    // ITA: { abbr: 'ITA', fullName: 'Italy' },
    // JAM: { abbr: 'JAM', fullName: 'Jamaica' },
    // JEY: { abbr: 'JEY', fullName: 'Jersey' },
    // JOR: { abbr: 'JOR', fullName: 'Jordan' },
    // JPN: { abbr: 'JPN', fullName: 'Japan' },
    // KAZ: { abbr: 'KAZ', fullName: 'Kazakhstan' },
    // KEN: { abbr: 'KEN', fullName: 'Kenya' },
    // KGZ: { abbr: 'KGZ', fullName: 'Kyrgyzstan' },
    // KHM: { abbr: 'KHM', fullName: 'Cambodia' },
    // KIR: { abbr: 'KIR', fullName: 'Kiribati' },
    // KNA: { abbr: 'KNA', fullName: 'Saint Kitts and Nevis' },
    // KOR: { abbr: 'KOR', fullName: 'Korea, Republic of' },
    // KWT: { abbr: 'KWT', fullName: 'Kuwait' },
    // LAO: { abbr: 'LAO', fullName: 'Lao People\'s Democratic Republic' },
    // LBN: { abbr: 'LBN', fullName: 'Lebanon' },
    // LBR: { abbr: 'LBR', fullName: 'Liberia' },
    // LBY: { abbr: 'LBY', fullName: 'Libya' },
    // LCA: { abbr: 'LCA', fullName: 'Saint Lucia' },
    // LIE: { abbr: 'LIE', fullName: 'Liechtenstein' },
    // LKA: { abbr: 'LKA', fullName: 'Sri Lanka' },
    // LSO: { abbr: 'LSO', fullName: 'Lesotho' },
    // LTU: { abbr: 'LTU', fullName: 'Lithuania' },
    // LUX: { abbr: 'LUX', fullName: 'Luxembourg' },
    // LVA: { abbr: 'LVA', fullName: 'Latvia' },
    // MAC: { abbr: 'MAC', fullName: 'Macao' },
    // MAF: { abbr: 'MAF', fullName: 'Saint Martin (French part)' },
    // MAR: { abbr: 'MAR', fullName: 'Morocco' },
    // MCO: { abbr: 'MCO', fullName: 'Monaco' },
    // MDA: { abbr: 'MDA', fullName: 'Moldova, Republic of' },
    // MDG: { abbr: 'MDG', fullName: 'Madagascar' },
    // MDV: { abbr: 'MDV', fullName: 'Maldives' },
    // MEX: { abbr: 'MEX', fullName: 'Mexico' },
    // MHL: { abbr: 'MHL', fullName: 'Marshall Islands' },
    // MKD: { abbr: 'MKD', fullName: 'Macedonia, the former Yugoslav Republic of' },
    // MLI: { abbr: 'MLI', fullName: 'Mali' },
    // MLT: { abbr: 'MLT', fullName: 'Malta' },
    // MMR: { abbr: 'MMR', fullName: 'Myanmar' },
    // MNE: { abbr: 'MNE', fullName: 'Montenegro' },
    // MNG: { abbr: 'MNG', fullName: 'Mongolia' },
    // MNP: { abbr: 'MNP', fullName: 'Northern Mariana Islands' },
    // MOZ: { abbr: 'MOZ', fullName: 'Mozambique' },
    // MRT: { abbr: 'MRT', fullName: 'Mauritania' },
    // MSR: { abbr: 'MSR', fullName: 'Montserrat' },
    // MTQ: { abbr: 'MTQ', fullName: 'Martinique' },
    // MUS: { abbr: 'MUS', fullName: 'Mauritius' },
    // MWI: { abbr: 'MWI', fullName: 'Malawi' },
    // MYS: { abbr: 'MYS', fullName: 'Malaysia' },
    // MYT: { abbr: 'MYT', fullName: 'Mayotte' },
    // NAM: { abbr: 'NAM', fullName: 'Namibia' },
    // NCL: { abbr: 'NCL', fullName: 'New Caledonia' },
    // NER: { abbr: 'NER', fullName: 'Niger' },
    // NFK: { abbr: 'NFK', fullName: 'Norfolk Island' },
    // NGA: { abbr: 'NGA', fullName: 'Nigeria' },
    // NIC: { abbr: 'NIC', fullName: 'Nicaragua' },
    // NIU: { abbr: 'NIU', fullName: 'Niue' },
    // NLD: { abbr: 'NLD', fullName: 'Netherlands' },
    // NOR: { abbr: 'NOR', fullName: 'Norway' },
    // NPL: { abbr: 'NPL', fullName: 'Nepal' },
    // NRU: { abbr: 'NRU', fullName: 'Nauru' },
    // NZL: { abbr: 'NZL', fullName: 'New Zealand' },
    // OMN: { abbr: 'OMN', fullName: 'Oman' },
    // PAK: { abbr: 'PAK', fullName: 'Pakistan' },
    // PAN: { abbr: 'PAN', fullName: 'Panama' },
    // PCN: { abbr: 'PCN', fullName: 'Pitcairn' },
    // PER: { abbr: 'PER', fullName: 'Peru' },
    // PHL: { abbr: 'PHL', fullName: 'Philippines' },
    // PLW: { abbr: 'PLW', fullName: 'Palau' },
    // PNG: { abbr: 'PNG', fullName: 'Papua New Guinea' },
    // POL: { abbr: 'POL', fullName: 'Poland' },
    // PRI: { abbr: 'PRI', fullName: 'Puerto Rico' },
    // PRK: { abbr: 'PRK', fullName: 'Korea, Democratic People\'s Republic of' },
    // PRT: { abbr: 'PRT', fullName: 'Portugal' },
    // PRY: { abbr: 'PRY', fullName: 'Paraguay' },
    // PSE: { abbr: 'PSE', fullName: 'Palestine, State of' },
    // PYF: { abbr: 'PYF', fullName: 'French Polynesia' },
    // QAT: { abbr: 'QAT', fullName: 'Qatar' },
    // REU: { abbr: 'REU', fullName: 'Réunion' },
    // ROU: { abbr: 'ROU', fullName: 'Romania' },
    // RUS: { abbr: 'RUS', fullName: 'Russian Federation' },
    // RWA: { abbr: 'RWA', fullName: 'Rwanda' },
    // SAU: { abbr: 'SAU', fullName: 'Saudi Arabia' },
    // SDN: { abbr: 'SDN', fullName: 'Sudan' },
    // SEN: { abbr: 'SEN', fullName: 'Senegal' },
    // SGP: { abbr: 'SGP', fullName: 'Singapore' },
    // SGS: { abbr: 'SGS', fullName: 'South Georgia and the South Sandwich Islands' },
    // SHN: { abbr: 'SHN', fullName: 'Saint Helena, Ascension and Tristan da Cunha' },
    // SJM: { abbr: 'SJM', fullName: 'Svalbard and Jan Mayen' },
    // SLB: { abbr: 'SLB', fullName: 'Solomon Islands' },
    // SLE: { abbr: 'SLE', fullName: 'Sierra Leone' },
    // SLV: { abbr: 'SLV', fullName: 'El Salvador' },
    // SMR: { abbr: 'SMR', fullName: 'San Marino' },
    // SOM: { abbr: 'SOM', fullName: 'Somalia' },
    // SPM: { abbr: 'SPM', fullName: 'Saint Pierre and Miquelon' },
    // SRB: { abbr: 'SRB', fullName: 'Serbia' },
    // SSD: { abbr: 'SSD', fullName: 'South Sudan' },
    // STP: { abbr: 'STP', fullName: 'Sao Tome and Principe' },
    // SUR: { abbr: 'SUR', fullName: 'Suriname' },
    // SVK: { abbr: 'SVK', fullName: 'Slovakia' },
    // SVN: { abbr: 'SVN', fullName: 'Slovenia' },
    // SWE: { abbr: 'SWE', fullName: 'Sweden' },
    // SWZ: { abbr: 'SWZ', fullName: 'Swaziland' },
    // SXM: { abbr: 'SXM', fullName: 'Sint Maarten (Dutch part)' },
    // SYC: { abbr: 'SYC', fullName: 'Seychelles' },
    // SYR: { abbr: 'SYR', fullName: 'Syrian Arab Republic' },
    // TCA: { abbr: 'TCA', fullName: 'Turks and Caicos Islands' },
    // TCD: { abbr: 'TCD', fullName: 'Chad' },
    // TGO: { abbr: 'TGO', fullName: 'Togo' },
    // THA: { abbr: 'THA', fullName: 'Thailand' },
    // TJK: { abbr: 'TJK', fullName: 'Tajikistan' },
    // TKL: { abbr: 'TKL', fullName: 'Tokelau' },
    // TKM: { abbr: 'TKM', fullName: 'Turkmenistan' },
    // TLS: { abbr: 'TLS', fullName: 'Timor-Leste' },
    // TON: { abbr: 'TON', fullName: 'Tonga' },
    // TTO: { abbr: 'TTO', fullName: 'Trinidad and Tobago' },
    // TUN: { abbr: 'TUN', fullName: 'Tunisia' },
    // TUR: { abbr: 'TUR', fullName: 'Turkey' },
    // TUV: { abbr: 'TUV', fullName: 'Tuvalu' },
    // TWN: { abbr: 'TWN', fullName: 'Taiwan, Province of China' },
    // TZA: { abbr: 'TZA', fullName: 'Tanzania, United Republic of' },
    // UGA: { abbr: 'UGA', fullName: 'Uganda' },
    // UKR: { abbr: 'UKR', fullName: 'Ukraine' },
    // UMI: { abbr: 'UMI', fullName: 'United States Minor Outlying Islands' },
    // URY: { abbr: 'URY', fullName: 'Uruguay' },
    // UZB: { abbr: 'UZB', fullName: 'Uzbekistan' },
    // VAT: { abbr: 'VAT', fullName: 'Holy See (Vatican City State)' },
    // VCT: { abbr: 'VCT', fullName: 'Saint Vincent and the Grenadines' },
    // VEN: { abbr: 'VEN', fullName: 'Venezuela, Bolivarian Republic of' },
    // VGB: { abbr: 'VGB', fullName: 'Virgin Islands, British' },
    // VIR: { abbr: 'VIR', fullName: 'Virgin Islands, U.S.' },
    // VNM: { abbr: 'VNM', fullName: 'Viet Nam' },
    // VUT: { abbr: 'VUT', fullName: 'Vanuatu' },
    // WLF: { abbr: 'WLF', fullName: 'Wallis and Futuna' },
    // WSM: { abbr: 'WSM', fullName: 'Samoa' },
    // YEM: { abbr: 'YEM', fullName: 'Yemen' },
    // ZAF: { abbr: 'ZAF', fullName: 'South Africa' },
    // ZMB: { abbr: 'ZMB', fullName: 'Zambia' },
    // ZWE: { abbr: 'ZWE', fullName: 'Zimbabwe' }
};

CountryCodes.totalCount = 0;
CountryCodes.abbrs      = [];
for (var countryCode in CountryCodes.ENUM) {
    CountryCodes.totalCount++;
    CountryCodes.abbrs.push(CountryCodes.ENUM[countryCode].abbr);
}

'use strict';

// merchantCodes.js

// SOURCE: http://www.irs.gov/irb/2004-31_IRB/ar17.html
//         http://web.archive.org/web/20070710202209/http://usa.visa.com/download/corporate/resources/mcc_booklet.pdf
//         http://en.wikipedia.org/wiki/Merchant_category_code

// mccNumber   = MCC
// description = Merchant Category
// reportable  = Reportable under 6041/6041A and Authority for Exception

var MerchantCodes = module.exports = [
 // { mccNumber: 0742, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Veterinary Services',                                                             reportable: true  },
 // { mccNumber: 0763, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Agricultural Cooperative',                                                        reportable: true  },
 // { mccNumber: 0780, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Landscaping Services',                                                            reportable: true  },
 // { mccNumber: 1520, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'General Contractors',                                                             reportable: true  },
 // { mccNumber: 1711, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Heating, Plumbing, A/C',                                                          reportable: true  },
 // { mccNumber: 1731, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Electrical Contractors',                                                          reportable: true  },
 // { mccNumber: 1740, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Masonry, Stonework, and Plaster',                                                 reportable: true  },
 // { mccNumber: 1750, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Carpentry Contractors',                                                           reportable: true  },
 // { mccNumber: 1761, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Roofing/Siding, Sheet Metal',                                                     reportable: true  },
 // { mccNumber: 1771, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Concrete Work Contractors',                                                       reportable: true  },
 // { mccNumber: 1799, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Special Trade Contractors',                                                       reportable: true  },
 // { mccNumber: 2741, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Miscellaneous Publishing and Printing',                                           reportable: true  },
 // { mccNumber: 2791, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Typesetting, Plate Making, and Related Services',                                 reportable: true  },
 // { mccNumber: 2842, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Specialty Cleaning',                                                              reportable: true  },
// RANGED - START
 // { mccNumber: null, mccMin: 3000, mccMax: 3299, abbr: 'XXXXXX', description: 'Airlines',                                                                        reportable: true  },
 // { mccNumber: null, mccMin: 3351, mccMax: 3441, abbr: 'XXXXXX', description: 'Car Rental',                                                                      reportable: true  },
 // { mccNumber: null, mccMin: 3501, mccMax: 3790, abbr: 'XXXXXX', description: 'Hotels/Motels/Inns/Resorts',                                                      reportable: true  },
// RANGED - END
 // { mccNumber: 4011, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Railroads',                                                                       reportable: false }, // No1.6041-3(c)
 // { mccNumber: 4111, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Commuter Transport, Ferries',                                                     reportable: true  },
 // { mccNumber: 4112, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Passenger Railways',                                                              reportable: true  },
 // { mccNumber: 4119, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Ambulance Services',                                                              reportable: true  },
 // { mccNumber: 4121, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Taxicabs/Limousines',                                                             reportable: true  },
 // { mccNumber: 4131, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Bus Lines',                                                                       reportable: true  },
 // { mccNumber: 4214, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Motor Freight Carriers and Trucking - Local and Long Distance,' +
 //                                                                             ' Moving and Storage Companies, and Local Delivery Services',                      reportable: false }, // No1.6041-3(c)
 // { mccNumber: 4215, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Courier Services',                                                                reportable: true  },
 // { mccNumber: 4225, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Public Warehousing and Storage - Farm Products, Refrigerated Goods,' +
 //                                                                             ' Household Goods, and Storage',                                                   reportable: false }, // No1.6041-3(c)
 // { mccNumber: 4411, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Cruise Lines',                                                                    reportable: true  },
 // { mccNumber: 4457, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Boat Rentals and Leases',                                                         reportable: true  },
 // { mccNumber: 4468, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Marinas, Service and Supplies',                                                   reportable: true  },
 // { mccNumber: 4511, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Airlines, Air Carriers',                                                          reportable: true  },
 // { mccNumber: 4582, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Airports, Flying Fields',                                                         reportable: true  },
 // { mccNumber: 4722, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Travel Agencies, Tour Operators',                                                 reportable: true  },
 // { mccNumber: 4723, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'TUI Travel - Germany',                                                            reportable: true  },
 // { mccNumber: 4784, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Tolls/Bridge Fees',                                                               reportable: false }, // No1.6041-3(c)
 // { mccNumber: 4789, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Transportation Services (Not Elsewhere Classified)',                              reportable: true  },
 // { mccNumber: 4812, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Telecommunication Equipment and Telephone Sales',                                 reportable: false }, // No1.6041-3(c)
 // { mccNumber: 4814, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Telecommunication Services',                                                      reportable: false }, // No1.6041-3(c)
    { mccNumber: 4815, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Information Retrieval Services',                                                          reportable: false }, // No1.6041-3(c)
 // { mccNumber: 4816, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Computer Network Services',                                                       reportable: false }, // No1.6041-3(c)
 // { mccNumber: 4821, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Telegraph Services',                                                              reportable: false }, // No1.6041-3(c)
 // { mccNumber: 4829, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Wires, Money Orders',                                                             reportable: false }, // No1.6041-3(c)
 // { mccNumber: 4899, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Cable, Satellite, and Other Pay Television and Radio',                            reportable: false }, // No1.6041-3(c)
 // { mccNumber: 4900, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Utilities',                                                                       reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5013, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Motor Vehicle Supplies and New Parts',                                            reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5021, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Office and Commercial Furniture',                                                 reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5039, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Construction Materials (Not Elsewhere Classified)',                               reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5044, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Photographic, Photocopy, Microfilm Equipment, and Supplies',                      reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5045, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Computers, Peripherals, and Software',                                            reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5046, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Commercial Equipment (Not Elsewhere Classified)',                                 reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5047, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Medical, Dental, Ophthalmic, and Hospital Equipment and Supplies',                reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5051, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Metal Service Centers',                                                           reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5065, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Electrical Parts and Equipment',                                                  reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5072, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Hardware, Equipment, and Supplies',                                               reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5074, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Plumbing, Heating Equipment, and Supplies',                                       reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5085, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Industrial Supplies (Not Elsewhere Classified)',                                  reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5094, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Precious Stones and Metals, Watches and Jewelry',                                 reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5099, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Durable Goods (Not Elsewhere Classified)',                                        reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5111, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Stationary, Office Supplies, Printing and Writing Paper',                         reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5122, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Drugs, Drug Proprietaries, and Druggist Sundries',                                reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5131, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Piece Goods, Notions, and Other Dry Goods',                                       reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5137, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Uniforms, Commercial Clothing',                                                   reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5139, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Commercial Footwear',                                                             reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5169, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Chemicals and Allied Products (Not Elsewhere Classified)',                        reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5172, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Petroleum and Petroleum Products',                                                reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5192, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Books, Periodicals, and Newspapers',                                              reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5193, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Florists Supplies, Nursery Stock, and Flowers',                                   reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5198, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Paints, Varnishes, and Supplies',                                                 reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5199, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Nondurable Goods (Not Elsewhere Classified)',                                     reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5200, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Home Supply Warehouse Stores',                                                    reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5211, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Lumber, Building Materials Stores',                                               reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5231, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Glass, Paint, and Wallpaper Stores',                                              reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5251, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Hardware Stores',                                                                 reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5261, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Nurseries, Lawn and Garden Supply Stores',                                        reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5271, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Mobile Home Dealers',                                                             reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5300, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Wholesale Clubs',                                                                 reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5309, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Duty Free Stores',                                                                reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5310, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Discount Stores',                                                                 reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5311, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Department Stores',                                                               reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5331, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Variety Stores',                                                                  reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5399, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Miscellaneous General Merchandise',                                               reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5411, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Grocery Stores, Supermarkets',                                                    reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5422, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Freezer and Locker Meat Provisioners',                                            reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5441, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Candy, Nut, and Confectionery Stores',                                            reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5451, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Dairy Products Stores',                                                           reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5462, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Bakeries',                                                                        reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5499, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Miscellaneous Food Stores - Convenience Stores and Specialty Markets',            reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5511, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Car and Truck Dealers (New & Used) Sales, Service, Repairs Parts and Leasing',    reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5521, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Car and Truck Dealers (Used Only) Sales, Service, Repairs Parts and Leasing',     reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5531, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Auto and Home Supply Stores',                                                     reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5532, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Automotive Tire Stores',                                                          reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5533, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Automotive Parts and Accessories Stores',                                         reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5541, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Service Stations',                                                                reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5542, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Automated Fuel Dispensers',                                                       reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5551, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Boat Dealers',                                                                    reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5561, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Motorcycle Shops, Dealers',                                                       reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5571, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Motorcycle Shops and Dealers',                                                    reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5592, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Motor Homes Dealers',                                                             reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5598, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Snowmobile Dealers',                                                              reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5599, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Miscellaneous Auto Dealers',                                                      reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5611, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Men’s and Boy’s Clothing and Accessories Stores',                                 reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5621, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Women’s Ready-To-Wear Stores',                                                    reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5631, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Women’s Accessory and Specialty Shops',                                           reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5641, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Children’s and Infant’s Wear Stores',                                             reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5651, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Family Clothing Stores',                                                          reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5655, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Sports and Riding Apparel Stores',                                                reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5661, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Shoe Stores',                                                                     reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5681, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Furriers and Fur Shops',                                                          reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5691, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Men’s, Women’s Clothing Stores',                                                  reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5697, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Tailors, Alterations',                                                            reportable: true  },
 // { mccNumber: 5698, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Wig and Toupee Stores',                                                           reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5699, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Miscellaneous Apparel and Accessory Shops',                                       reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5712, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Furniture, Home Furnishings, and Equipment Stores, Except Appliances',            reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5713, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Floor Covering Stores',                                                           reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5714, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Drapery, Window Covering, and Upholstery Stores',                                 reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5718, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Fireplace, Fireplace Screens, and Accessories Stores',                            reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5719, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Miscellaneous Home Furnishing Specialty Stores',                                  reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5722, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Household Appliance Stores',                                                      reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5732, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Electronics Stores',                                                              reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5733, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Music Stores-Musical Instruments, Pianos, and Sheet Music',                       reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5734, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Computer Software Stores',                                                        reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5735, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Record Stores',                                                                   reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5811, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Caterers',                                                                        reportable: true  },
// STARTING CATEGORIES - START
// { mccNumber: 5812, mccMin: null, mccMax: null, abbr: 'RESTEI', description: 'Eating Places, Restaurants',                                                      reportable: false }, // No1.6041-3(c)
// { mccNumber: 5813, mccMin: null, mccMax: null, abbr: 'RESTBR', description: 'Drinking Places',                                                                 reportable: false }, // No1.6041-3(c)
// { mccNumber: 5814, mccMin: null, mccMax: null, abbr: 'RESTFF', description: 'Fast Food Restaurants',                                                           reportable: false }, // No1.6041-3(c)
// STARTING CATEGORIES - END
 // { mccNumber: 5912, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Drug Stores and Pharmacies',                                                      reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5921, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Package Stores-Beer, Wine, and Liquor',                                           reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5931, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Used Merchandise and Secondhand Stores',                                          reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5932, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Antique Shops',                                                                   reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5933, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Pawn Shops',                                                                      reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5935, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Wrecking and Salvage Yards',                                                      reportable: true  },
 // { mccNumber: 5937, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Antique Reproductions',                                                           reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5940, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Bicycle Shops',                                                                   reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5941, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Sporting Goods Stores',                                                           reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5942, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Book Stores',                                                                     reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5943, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Stationery Stores, Office, and School Supply Stores',                             reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5944, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Jewelry Stores, Watches, Clocks, and Silverware Stores',                          reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5945, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Hobby, Toy, and Game Shops',                                                      reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5946, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Camera and Photographic Supply Stores',                                           reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5947, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Gift, Card, Novelty, and Souvenir Shops',                                         reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5948, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Luggage and Leather Goods Stores',                                                reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5949, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Sewing, Needlework, Fabric, and Piece Goods Stores',                              reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5950, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Glassware, Crystal Stores',                                                       reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5960, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Direct Marketing - Insurance Services',                                           reportable: true  },
 // { mccNumber: 5962, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Direct Marketing - Travel',                                                       reportable: true  },
 // { mccNumber: 5963, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Door-To-Door Sales',                                                              reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5964, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Direct Marketing - Catalog Merchant',                                             reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5965, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Direct Marketing - Combination Catalog and Retail Merchant',                      reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5966, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Direct Marketing - Outbound Tele',                                                reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5967, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Direct Marketing - Inbound Tele',                                                 reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5968, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Direct Marketing - Subscription',                                                 reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5969, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Direct Marketing - Other',                                                        reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5970, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Artist’s Supply and Craft Shops',                                                 reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5971, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Art Dealers and Galleries',                                                       reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5972, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Stamp and Coin Stores',                                                           reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5973, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Religious Goods Stores',                                                          reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5975, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Hearing Aids Sales and Supplies',                                                 reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5976, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Orthopedic Goods - Prosthetic Devices',                                           reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5977, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Cosmetic Stores',                                                                 reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5978, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Typewriter Stores',                                                               reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5983, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Fuel Dealers (Non Automotive)',                                                   reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5992, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Florists',                                                                        reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5993, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Cigar Stores and Stands',                                                         reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5994, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'News Dealers and Newsstands',                                                     reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5995, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Pet Shops, Pet Food, and Supplies',                                               reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5996, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Swimming Pools Sales',                                                            reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5997, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Electric Razor Stores',                                                           reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5998, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Tent and Awning Shops',                                                           reportable: false }, // No1.6041-3(c)
 // { mccNumber: 5999, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Miscellaneous Specialty Retail',                                                  reportable: false }, // No1.6041-3(c)
 // { mccNumber: 6010, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Manual Cash Disburse',                                                            reportable: false }, // No1.6041-3(c)
 // { mccNumber: 6011, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Automated Cash Disburse',                                                         reportable: false }, // No1.6041-3(c)
 // { mccNumber: 6012, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Financial Institutions',                                                          reportable: true  },
 // { mccNumber: 6051, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Non-FI, Money Orders',                                                            reportable: false }, // No1.6041-3(c)
 // { mccNumber: 6211, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Security Brokers/Dealers',                                                        reportable: true  },
 // { mccNumber: 6300, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Insurance Underwriting, Premiums',                                                reportable: false }, // No1.6041-3(c)
 // { mccNumber: 6399, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Insurance - Default',                                                             reportable: false }, // No1.6041-3(c)
 // { mccNumber: 6513, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Real Estate Agents and Managers - Rentals',                                       reportable: true  },
 // { mccNumber: 7011, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Hotels, Motels, and Resorts',                                                     reportable: true  },
 // { mccNumber: 7012, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Timeshares',                                                                      reportable: true  },
 // { mccNumber: 7032, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Sporting/Recreation Camps',                                                       reportable: true  },
 // { mccNumber: 7033, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Trailer Parks, Campgrounds',                                                      reportable: true  },
 // { mccNumber: 7210, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Laundry, Cleaning Services',                                                      reportable: true  },
 // { mccNumber: 7211, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Laundries',                                                                       reportable: true  },
 // { mccNumber: 7216, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Dry Cleaners',                                                                    reportable: true  },
 // { mccNumber: 7217, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Carpet/Upholstery Cleaning',                                                      reportable: true  },
 // { mccNumber: 7221, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Photographic Studios',                                                            reportable: true  },
 // { mccNumber: 7230, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Barber and Beauty Shops',                                                         reportable: true  },
 // { mccNumber: 7251, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Shoe Repair/Hat Cleaning',                                                        reportable: true  },
 // { mccNumber: 7261, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Funeral Services, Crematories',                                                   reportable: true  },
 // { mccNumber: 7273, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Dating/Escort Services',                                                          reportable: true  },
 // { mccNumber: 7276, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Tax Preparation Services',                                                        reportable: true  },
 // { mccNumber: 7277, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Counseling Services',                                                             reportable: true  },
 // { mccNumber: 7278, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Buying/Shopping Services',                                                        reportable: true  },
 // { mccNumber: 7296, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Clothing Rental',                                                                 reportable: true  },
 // { mccNumber: 7297, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Massage Parlors',                                                                 reportable: true  },
 // { mccNumber: 7298, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Health and Beauty Spas',                                                          reportable: true  },
 // { mccNumber: 7299, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Miscellaneous General Services',                                                  reportable: true  },
 // { mccNumber: 7311, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Advertising Services',                                                            reportable: true  },
 // { mccNumber: 7321, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Credit Reporting Agencies',                                                       reportable: true  },
 // { mccNumber: 7333, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Commercial Photography, Art and Graphics',                                        reportable: true  },
 // { mccNumber: 7338, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Quick Copy, Repro, and Blueprint',                                                reportable: true  },
 // { mccNumber: 7339, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Secretarial Support Services',                                                    reportable: true  },
 // { mccNumber: 7342, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Exterminating Services',                                                          reportable: true  },
 // { mccNumber: 7349, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Cleaning and Maintenance',                                                        reportable: true  },
 // { mccNumber: 7361, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Employment/Temp Agencies',                                                        reportable: true  },
 // { mccNumber: 7372, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Computer Programming',                                                            reportable: true  },
 // { mccNumber: 7375, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Information Retrieval Services',                                                  reportable: true  },
 // { mccNumber: 7379, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Computer Repair',                                                                 reportable: true  },
 // { mccNumber: 7392, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Consulting, Public Relations',                                                    reportable: true  },
 // { mccNumber: 7393, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Detective Agencies',                                                              reportable: true  },
 // { mccNumber: 7394, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Equipment Rental',                                                                reportable: true  },
 // { mccNumber: 7395, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Photo Developing',                                                                reportable: true  },
 // { mccNumber: 7399, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Miscellaneous Business Services',                                                 reportable: true  },
 // { mccNumber: 7511, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Truck Stop',                                                                      reportable: true  },
 // { mccNumber: 7512, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Car Rental Agencies',                                                             reportable: true  },
 // { mccNumber: 7513, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Truck/Utility Trailer Rentals',                                                   reportable: true  },
 // { mccNumber: 7519, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Recreational Vehicle Rentals',                                                    reportable: true  },
 // { mccNumber: 7523, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Parking Lots, Garages',                                                           reportable: true  },
 // { mccNumber: 7531, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Auto Body Repair Shops',                                                          reportable: true  },
 // { mccNumber: 7534, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Tire Retreading and Repair',                                                      reportable: true  },
 // { mccNumber: 7535, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Auto Paint Shops',                                                                reportable: true  },
 // { mccNumber: 7538, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Auto Service Shops',                                                              reportable: true  },
 // { mccNumber: 7542, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Car Washes',                                                                      reportable: true  },
 // { mccNumber: 7549, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Towing Services',                                                                 reportable: true  },
 // { mccNumber: 7622, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Electronics Repair Shops',                                                        reportable: true  },
 // { mccNumber: 7623, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'A/C, Refrigeration Repair',                                                       reportable: true  },
 // { mccNumber: 7629, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Small Appliance Repair',                                                          reportable: true  },
 // { mccNumber: 7631, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Watch/Jewelry Repair',                                                            reportable: true  },
 // { mccNumber: 7641, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Furniture Repair, Refinishing',                                                   reportable: true  },
 // { mccNumber: 7692, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Welding Repair',                                                                  reportable: true  },
 // { mccNumber: 7699, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Miscellaneous Repair Shops',                                                      reportable: true  },
 // { mccNumber: 7829, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Picture/Video Production',                                                        reportable: true  },
 // { mccNumber: 7832, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Motion Picture Theaters',                                                         reportable: true  },
 // { mccNumber: 7841, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Video Tape Rental Stores',                                                        reportable: true  },
 // { mccNumber: 7911, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Dance Hall, Studios, Schools',                                                    reportable: true  },
 // { mccNumber: 7922, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Theatrical Ticket Agencies',                                                      reportable: true  },
 // { mccNumber: 7929, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Bands, Orchestras',                                                               reportable: true  },
 // { mccNumber: 7932, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Billiard/Pool Establishments',                                                    reportable: true  },
 // { mccNumber: 7933, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Bowling Alleys',                                                                  reportable: true  },
 // { mccNumber: 7941, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Sports Clubs/Fields',                                                             reportable: true  },
 // { mccNumber: 7991, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Tourist Attractions and Exhibits',                                                reportable: true  },
 // { mccNumber: 7992, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Golf Courses - Public',                                                           reportable: true  },
 // { mccNumber: 7993, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Video Amusement Game Supplies',                                                   reportable: false }, // No1.6041-3(c)
 // { mccNumber: 7994, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Video Game Arcades',                                                              reportable: true  },
 // { mccNumber: 7995, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Betting/Casino Gambling',                                                         reportable: true  },
 // { mccNumber: 7996, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Amusement Parks/Carnivals',                                                       reportable: true  },
 // { mccNumber: 7997, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Country Clubs',                                                                   reportable: true  },
 // { mccNumber: 7998, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Aquariums',                                                                       reportable: true  },
 // { mccNumber: 7999, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Miscellaneous Recreation Services',                                               reportable: true  },
 // { mccNumber: 8011, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Doctors',                                                                         reportable: true  },
 // { mccNumber: 8021, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Dentists, Orthodontists',                                                         reportable: true  },
 // { mccNumber: 8031, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Osteopaths',                                                                      reportable: true  },
 // { mccNumber: 8041, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Chiropractors',                                                                   reportable: true  },
 // { mccNumber: 8042, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Optometrists, Ophthalmologist',                                                   reportable: true  },
 // { mccNumber: 8043, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Opticians, Eyeglasses',                                                           reportable: true  },
 // { mccNumber: 8049, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Chiropodists, Podiatrists',                                                       reportable: true  },
 // { mccNumber: 8050, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Nursing/Personal Care',                                                           reportable: true  },
 // { mccNumber: 8062, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Hospitals',                                                                       reportable: true  },
 // { mccNumber: 8071, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Medical and Dental Labs',                                                         reportable: true  },
 // { mccNumber: 8099, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Medical Services',                                                                reportable: true  },
 // { mccNumber: 8111, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Legal Services, Attorneys',                                                       reportable: true  },
 // { mccNumber: 8211, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Elementary, Secondary Schools',                                                   reportable: false }, // No1.6041-3(p)(2)
 // { mccNumber: 8220, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Colleges, Universities',                                                          reportable: false }, // No1.6041-3(p)(2)
 // { mccNumber: 8241, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Correspondence Schools',                                                          reportable: false }, // No1.6041-3(p)(2)
 // { mccNumber: 8244, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Business/Secretarial Schools',                                                    reportable: false }, // No1.6041-3(p)(2)
 // { mccNumber: 8249, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Vocational/Trade Schools',                                                        reportable: false }, // No1.6041-3(p)(2)
 // { mccNumber: 8299, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Educational Services',                                                            reportable: true  },
 // { mccNumber: 8351, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Child Care Services',                                                             reportable: true  },
 // { mccNumber: 8398, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Charitable and Social Service Organizations - Fundraising',                       reportable: false }, // No1.6041-3(p)(2)
 // { mccNumber: 8641, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Civic, Social, Fraternal Associations',                                           reportable: false }, // No1.6041-3(p)(2)
 // { mccNumber: 8651, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Political Organizations',                                                         reportable: true  },
 // { mccNumber: 8661, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Religious Organizations',                                                         reportable: false }, // No1.6041-3(p)(2)
 // { mccNumber: 8675, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Automobile Associations',                                                         reportable: true  },
 // { mccNumber: 8699, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Membership Organizations',                                                        reportable: true  },
 // { mccNumber: 8734, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Testing Laboratories',                                                            reportable: true  },
 // { mccNumber: 8911, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Architectural/Surveying Services',                                                reportable: true  },
 // { mccNumber: 8931, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Accounting/Bookkeeping Services',                                                 reportable: true  },
 // { mccNumber: 8999, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Professional Services',                                                           reportable: true  },
 // { mccNumber: 9211, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Court Costs, Including Alimony and Child Support - Courts of Law',                reportable: false }, // No1.6041-3(p)(4)
 // { mccNumber: 9222, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Fines - Government Administrative Entities',                                      reportable: false }, // No1.6041-3(p)(4)
 // { mccNumber: 9223, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Bail and Bond Payments (payment to the surety for the bond, not the actual' +
 //                                                                             ' bond paid to the government agency)',                                            reportable: true  },
 // { mccNumber: 9311, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Tax Payments - Government Agencies',                                              reportable: false }, // No1.6041-3(p)(4)
 // { mccNumber: 9399, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Government Services (Not Elsewhere Classified)',                                  reportable: false }, // No1.6041-3(p)(4)
 // { mccNumber: 9402, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Postal Services - Government Only',                                               reportable: false }, // No1.6041-3(p)(3)
 // { mccNumber: 9405, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'U.S. Federal Government Agencies or Departments',                                 reportable: false }, // No1.6041-3(p)(3)
 // { mccNumber: 9950, mccMin: null, mccMax: null, abbr: 'XXXXXX', description: 'Intra-Company Purchases',                                                         reportable: false }  // No1.6041-3(c)
];

'use strict';

const require('csv');
const require('node-pandas-js');
const require('simplejson');

alphabet = '''self.{digital_nucleobase} = function(proofOfLife) {{
    verbose('#{digital_nucleobase}');
    
    var digitalNucleobaseAlphabet = {'A': 00, 'T': 01, 'C': 10, 'G': 11};
    
'''
var dictify = function(frame,key_position):
    """Turn API csv to dict structure
    Keyword arguments:
    frame -- dataframe of csv
    key_position -- position of key
    """
    d = {}
    for row in frame.values:
        elem =  dict(zip(frame.columns, row))
        d.setdefault(row[key_position],[]).append(elem)
    return d
    
 
var automate = function(nucleobase_list, template_file, file_path):  
    """Turn csv list of APIs to connection files
    Keyword arguments:
    nucleobase_list -- csv of reference nucleobases
    template_file -- nucleobase template file
    file_path -- file save location
    """
    
    with open(template_file) as file:# Use file to refer to the file object
        template = file.read()
        
    return(nucleobase_list)
    nucleobase_json = pd.read_csv(nucleobase_list)
    nucleobase_dict = dictify(nucleobase_json,0)
    for key in nucleobase_dict:
        genome = key
        genome_count = 0
        for digitalNucleobases in nucleobase_dict[genome]:
            if genome_count == 0:
                digitalNucleobases = alphabet.format(function_name=allele['Alleles'],
                                                  genome=genome,
                                                 response=endpoint['Example Response'])
                genome_count += 1
            else:
                digitalNucleobases = digitalNucleobases  + alphabet.format(allele_name=digitalNucleobase['Digital Nucleobase'],
                                                                              genome=genome,
                                                                              response=digitalNucleobase['Example Response'])
                genome_count += 1
        with open( file_path + "/" + "{genome}.txt".format(genome=genome),'w') as file:
            file.write(template.format(heading=genome,genome=genome,alphabet=digitalNucleobase_allele))
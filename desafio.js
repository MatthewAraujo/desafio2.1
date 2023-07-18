const fs = require('fs');
const { DateTime } = require('luxon');
class JSONTransformer {
  constructor(inputFile, outputFile, Validation) {
    this.inputFile = inputFile;
    this.outputFile = outputFile;
    this.Validation = new Validation();
  }

  readJSONFile() {
    try {
      const jsonString = fs.readFileSync(this.inputFile);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error(`Erro ao ler o arquivo JSON: ${this.inputFile}`, error);
      return null;
    }
  }

  transformData(originalData) {
    const transformedData = [];
  
    for (const clientData of originalData) {
      this.Validation.clearErrors();      
      
      Object.keys(clientData).forEach((key) => {
       
       if( this.Validation[`validate${key.charAt(0).toUpperCase() + key.slice(1)}`]){
        this.Validation[`validate${key.charAt(0).toUpperCase() + key.slice(1)}`](clientData[key]);
       }
      })

      transformedData.push({
        dados: clientData,
        erros: this.Validation.errors,
      });
    }
  
    return transformedData;
  }

  isArrayOfObjects(data) {
    return Array.isArray(data) && data.length > 0 && typeof data[0] === 'object';
  }
  
  renameFile(){
    fs.renameSync(this.inputFile, this.outputFile, function(err) {
      if ( err ) console.log('ERROR: ' + err);
    });
  }

  saveJSONFile(data) {
    fs.writeFileSync(this.outputFile, JSON.stringify(data, null, 2));
    console.log(`Arquivo JSON transformado e salvo em: ${this.outputFile}`);
  }

  executeTransformation() {
    const inputData = this.readJSONFile();

    const isValidJSON = this.isArrayOfObjects(inputData);


    if (inputData && isValidJSON) {
      const transformedData = this.transformData(inputData);
      this.renameFile();
      this.saveJSONFile(transformedData);
    } else {
      console.error('O arquivo de entrada não é um JSON válido.');
    }
  }
}

class Validation {
  constructor() {
    this.errors = [];
  }

  validateNome(name) {


    if(!name){
      this.errors.push({
        campo: 'nome',
        mensagem: 'O campo "nome" é obrigatório.',
      });
    }


    if(name.length < 5 || name.length > 60) {
      this.errors.push({
        campo: 'nome',
        mensagem: 'O campo "nome" deve ter pelo menos 3 caracteres.',
      });
    }
  }

  validateCpf(cpf) {

    if(!cpf){
      this.errors.push({
        campo: 'cpf',
        mensagem: 'O campo "cpf" é obrigatório.',
      });
    }

    if(cpf.length !== 11) {
      this.errors.push({
        campo: 'cpf',
        mensagem: 'O campo "cpf" deve ter pelo menos 11 caracteres.',
      });
    }
  }

  validateDt_nascimento(dtNascimento){
    
    if(!dtNascimento){
      this.errors.push({
        campo: 'dt_nascimento',
        mensagem: 'O campo "dt_nascimento" é obrigatório.',
      });
    }
    
    const data = DateTime.fromFormat(dtNascimento, 'ddMMyyyy');
    if (!data.isValid) {
      this.errors.push({
        campo: 'dt_nascimento',
        mensagem: 'O campo "dt_nascimento" deve ser uma data válida no formato ddMMyyyy.',
      })
    }    
  }

  validateRenda_mensal(rendaMensal){
    const pattern = /^-?\d+(\,\d{2})?$/;


    if(rendaMensal < 0){
      this.errors.push({
        campo: 'renda_mensal',
        mensagem: 'O campo "renda_mensal" não pode ser negativo.',
      });
    }


    if(!pattern.test(rendaMensal)){
      this.errors.push({
        campo: 'renda_mensal',
        mensagem: 'Os ultimos 3 numeros da renda mensal deve ser seguidos por virgula + 2 numeros.',
      });
    }
  }

  validateEstado_civil(estado_civil){
    const estadoCivil = ['s', 'c', 'd', 'v'];

    if(!estadoCivil.includes(estado_civil.toLowerCase())){
      this.errors.push({
        campo: 'estado_civil',
        mensagem: 'O campo "estado_civil" deve ser s, c, d ou v.',
      });
    }
  }

  clearErrors() {
    this.errors = [];
  }
}

class FormatFileName{
  constructor(fileName){
    this.fileName = fileName;
  }

  createFileName(){
    const now = DateTime.now().setLocale("pt-br").toFormat("D-HHmmss");
    const formatFile  = now.replaceAll( '/', '')
    return `erros-${formatFile}.json`
  }
}

const fileName = process.argv[2]

const fileOutput = new FormatFileName(fileName).createFileName();
const transformer = new JSONTransformer(fileName, fileOutput, Validation);
transformer.executeTransformation();



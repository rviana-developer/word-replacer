'use strict'

const Helpers = use("Helpers");

const fs = require('fs');
const path = require('path');
const md5 = require('md5');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
var ImageModule = require('docxtemplater-image-module');

const content = fs.readFileSync(path.resolve('file.docx'), 'binary');

const zip = new PizZip(content);


class FormController {
  async index({ view }) {
    return view.render('index');
  }
  async store({ request, response, session }) {
    response.implicitEnd = false;
    const { placeholder1, placeholder2, placeholder3 } = request.all();
    const imageName = md5(new Date().getTime());

    if(request.file('image')) {
      const image = request.file('image', {
        types: ['image'],
        size: '2mb'
      })

      await image.move(Helpers.tmpPath('imgs'), {
        name: `${imageName}.jpg`,
        overwrite: true
      });

      if(!image.moved()) {
        session.withErrors({ image: "A imagem não suportada servidor!" }).flashAll();
        return response.redirect("back");
      } else {
        var opts = {};
        opts.centered = false;
        opts.getImage = function(tagValue, tagName) {
          return fs.readFileSync(tagValue);
        };
        opts.getSize = function(img, tagValue, tagName) {
          return [350, 150];
        };

        var imageModule = new ImageModule(opts);

        var doc = new Docxtemplater();
        doc.attachModule(imageModule);
        doc.loadZip(zip);
          doc.setData({
            placeholder_1: placeholder1,
            placeholder_2: placeholder2,
            placeholder_3: placeholder3,
            image: Helpers.tmpPath(`imgs/${imageName}.jpg`)
          })

        try {
          doc.render()
        } catch(error) {
          var e = {
            message: error.message,
            name: error.name,
            stack: error.stack,
            properties: error.properties,
        }
        console.log(JSON.stringify({error: e}));
        throw error;
        }
        var buf = doc.getZip().generate({type: 'nodebuffer', comperssion: 'DEFLATE'});
        response.header('Content-Disposition', `attachment; filename=${imageName}.docx`);
        response.send(Buffer.from(Buffer.from(buf), 'base64'));
        fs.unlinkSync(Helpers.tmpPath(`imgs/${imageName}.jpg`));
      }
    }


  }
}

module.exports = FormController
